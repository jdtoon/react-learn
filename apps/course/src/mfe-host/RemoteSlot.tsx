import { emit, type RemoteDescriptor, type RemoteKind } from '@react-field-guide/mfe-contracts';
import React, {
  Component,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { loadFederated } from './federation';
import { SlotFrame, type ReactIdentity, type SlotState } from './SlotFrame';
import { slotMeta } from './slots';
import { ComponentVariantContext } from './variant';

export const REMOTE_LOAD_TIMEOUT_MS = 8000;

export interface LoadedRemote {
  Component: ComponentType;
  probe?: () => Promise<ReactIdentity | null>;
}

export interface MountContext {
  version: string;
}

export type RemoteLoader = (
  descriptor: RemoteDescriptor,
  context: MountContext,
) => Promise<LoadedRemote>;

export interface SlotMeasure {
  id: string;
  identity: ReactIdentity | null;
  bytes: number;
}

interface MountModule {
  mount?: (element: HTMLElement, props: MountContext) => () => void;
  reactIdentity?: unknown;
}

export function transferredBytes(url: string): number {
  const prefix = url.slice(0, url.lastIndexOf('/') + 1);
  let total = 0;
  for (const entry of performance.getEntriesByType('resource')) {
    if (!entry.name.startsWith(prefix)) continue;
    const timing = entry as PerformanceResourceTiming;
    total += timing.transferSize > 0 ? timing.transferSize : timing.encodedBodySize;
  }
  return total;
}

async function loadFederationRemote(descriptor: RemoteDescriptor): Promise<LoadedRemote> {
  const module = await loadFederated<{ default?: ComponentType }>(descriptor);
  if (!module.default) throw new Error(`${descriptor.id} has no default export`);
  return {
    Component: module.default,
    probe: async () => {
      try {
        const identity = await loadFederated<{ default: unknown }>({
          ...descriptor,
          expose: './reactIdentity',
        });
        return identity.default === React ? 'same' : 'different';
      } catch {
        return null;
      }
    },
  };
}

async function loadModuleMount(
  descriptor: RemoteDescriptor,
  context: MountContext,
): Promise<LoadedRemote> {
  const module = (await import(descriptor.url)) as MountModule;
  const { mount } = module;
  if (typeof mount !== 'function') throw new Error(`${descriptor.id} does not export mount`);

  const MountedRemote = () => {
    const target = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const element = target.current;
      if (!element) return;
      return mount(element, context);
    }, []);
    return <div ref={target} className="slot-mount" />;
  };

  return {
    Component: MountedRemote,
    probe: async () => {
      if (module.reactIdentity === undefined) return null;
      return module.reactIdentity === React ? 'same' : 'different';
    },
  };
}

async function loadWebComponent(descriptor: RemoteDescriptor): Promise<LoadedRemote> {
  const { tag } = descriptor;
  if (!tag) throw new Error(`${descriptor.id} has no element tag`);
  await import(descriptor.url);
  if (!customElements.get(tag)) throw new Error(`${descriptor.id} did not define <${tag}>`);

  const lightTag = `${tag}-light`;
  const hasLight = customElements.get(lightTag) !== undefined;

  const WebComponent = () => {
    const variant = useContext(ComponentVariantContext);
    const light = variant === 'light' && hasLight;
    return createElement(light ? lightTag : tag, { 'data-variant': light ? 'light' : 'shadow' });
  };
  return { Component: WebComponent };
}

interface StoreSelection {
  storeId: string;
  label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseStoreSelection(data: unknown): StoreSelection | null {
  if (!isRecord(data) || data['type'] !== 'locator:store-selected') return null;
  const payload = data['payload'];
  if (!isRecord(payload)) return null;
  const { storeId, label } = payload;
  if (typeof storeId !== 'string' || typeof label !== 'string') return null;
  return { storeId, label };
}

function postTheme(frame: HTMLIFrameElement | null, origin: string): void {
  frame?.contentWindow?.postMessage(
    { type: 'host:theme', theme: document.documentElement.dataset['theme'] ?? null },
    origin,
  );
}

async function loadIframe(descriptor: RemoteDescriptor): Promise<LoadedRemote> {
  const response = await fetch(descriptor.url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${descriptor.id} answered ${response.status}`);
  if (!response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`${descriptor.id} did not return an HTML page`);
  }
  const origin = new URL(descriptor.url).origin;

  const Frame = () => {
    const frame = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
        const selection = parseStoreSelection(event.data);
        if (selection) emit('locator:store-selected', selection, 'legacy-iframe');
      };
      window.addEventListener('message', onMessage);
      const observer = new MutationObserver(() => postTheme(frame.current, origin));
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
      return () => {
        window.removeEventListener('message', onMessage);
        observer.disconnect();
      };
    }, []);

    return (
      <iframe
        ref={frame}
        className="slot-iframe"
        src={descriptor.url}
        title="Store locator, a separate legacy page"
        onLoad={() => postTheme(frame.current, origin)}
      />
    );
  };
  return { Component: Frame };
}

const loaders: Partial<Record<RemoteKind, RemoteLoader>> = {
  federation: loadFederationRemote,
  'module-mount': loadModuleMount,
  'web-component': loadWebComponent,
  iframe: loadIframe,
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; loaded: LoadedRemote; loadMs: number }
  | { status: 'failed'; message: string; loadMs: number };

function describeError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  const line = text.split('\n')[0] ?? text;
  return line.length > 160 ? `${line.slice(0, 157)}...` : line;
}

function SlotFallback({ title, message }: { title: string; message: string }) {
  return (
    <div role="status" className="slot-fallback">
      <p>
        <strong>{title} is unavailable right now.</strong> The host caught the failure and the rest
        of the page keeps working.
      </p>
      <p className="slot-reason">{message}</p>
    </div>
  );
}

interface BoundaryProps {
  title: string;
  onError: (error: Error) => void;
  children: ReactNode;
}

class SlotBoundary extends Component<BoundaryProps, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  override render() {
    const { error } = this.state;
    if (error) return <SlotFallback title={this.props.title} message={describeError(error)} />;
    return this.props.children;
  }
}

interface LoadedSlotProps {
  descriptor: RemoteDescriptor;
  loader: RemoteLoader;
  title: string;
  xray: boolean;
  version: string;
  onMeasure: ((slot: string, measure: SlotMeasure | null) => void) | undefined;
}

function LoadedSlot({ descriptor, loader, title, xray, version, onMeasure }: LoadedSlotProps) {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [identity, setIdentity] = useState<ReactIdentity | null>(null);
  const [crash, setCrash] = useState<Error | null>(null);

  useEffect(() => {
    const started = performance.now();
    let settled = false;
    const settle = (next: LoadState) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      setLoad(next);
    };
    const timer = setTimeout(() => {
      settle({
        status: 'failed',
        message: `Timed out after ${REMOTE_LOAD_TIMEOUT_MS / 1000} s`,
        loadMs: performance.now() - started,
      });
    }, REMOTE_LOAD_TIMEOUT_MS);

    loader(descriptor, { version }).then(
      (loaded) => settle({ status: 'ready', loaded, loadMs: performance.now() - started }),
      (error: unknown) =>
        settle({
          status: 'failed',
          message: describeError(error),
          loadMs: performance.now() - started,
        }),
    );

    return () => {
      settled = true;
      clearTimeout(timer);
    };
  }, [descriptor, loader, version]);

  const probe = load.status === 'ready' ? load.loaded.probe : undefined;
  useEffect(() => {
    if (!probe) return;
    let active = true;
    probe().then((result) => {
      if (active) setIdentity(result);
    });
    return () => {
      active = false;
    };
  }, [probe]);

  const ready = load.status === 'ready' && !crash;
  useEffect(() => {
    if (!ready || !onMeasure) return;
    onMeasure(descriptor.slot, {
      id: descriptor.id,
      identity,
      bytes: transferredBytes(descriptor.url),
    });
    return () => onMeasure(descriptor.slot, null);
  }, [ready, identity, descriptor, onMeasure]);

  let state: SlotState = load.status;
  if (crash) state = 'failed';

  let body: ReactNode;
  if (crash) {
    body = <SlotFallback title={title} message={describeError(crash)} />;
  } else if (load.status === 'loading') {
    body = <p className="slot-note">Loading {title}</p>;
  } else if (load.status === 'failed') {
    body = <SlotFallback title={title} message={load.message} />;
  } else {
    const Remote = load.loaded.Component;
    body = (
      <SlotBoundary title={title} onError={setCrash}>
        <Remote />
      </SlotBoundary>
    );
  }

  return (
    <SlotFrame
      slot={descriptor.slot}
      title={title}
      xray={xray}
      state={state}
      descriptor={descriptor}
      loadMs={load.status === 'loading' ? null : load.loadMs}
      identity={state === 'ready' ? identity : null}
    >
      {body}
    </SlotFrame>
  );
}

export interface RemoteSlotProps {
  descriptor: RemoteDescriptor;
  xray: boolean;
  version?: string;
  onMeasure?: (slot: string, measure: SlotMeasure | null) => void;
}

export function RemoteSlot({ descriptor, xray, version, onMeasure }: RemoteSlotProps) {
  const mountVersion = version ?? descriptor.version;
  const title = slotMeta(descriptor.slot)?.title ?? descriptor.slot;
  const loader = loaders[descriptor.kind];

  if (!loader) {
    return (
      <SlotFrame
        slot={descriptor.slot}
        title={title}
        xray={xray}
        state="unwired"
        descriptor={descriptor}
      >
        <div role="status" className="slot-fallback">
          <p>Integration style {descriptor.kind} is not wired yet.</p>
        </div>
      </SlotFrame>
    );
  }

  return (
    <LoadedSlot
      key={`${descriptor.id}|${descriptor.url}|${mountVersion}`}
      descriptor={descriptor}
      loader={loader}
      title={title}
      xray={xray}
      version={mountVersion}
      onMeasure={onMeasure}
    />
  );
}

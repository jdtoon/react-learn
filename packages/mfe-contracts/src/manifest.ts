export type RemoteKind = 'federation' | 'module-mount' | 'web-component' | 'iframe';

export type RemoteFramework = 'react' | 'vue' | 'svelte' | 'angular' | 'plain';

export interface RemoteDescriptor {
  id: string;
  slot: string;
  team: string;
  framework: RemoteFramework;
  kind: RemoteKind;
  version: string;
  url: string;
  container?: string;
  expose?: string;
  tag?: string;
  bytes?: number;
}

export interface RemoteManifest {
  remotes: RemoteDescriptor[];
  live: Record<string, string>;
}

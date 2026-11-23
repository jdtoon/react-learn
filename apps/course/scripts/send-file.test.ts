import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sendFile } from '../../../scripts/send-file.ts';

let dir = '';
let server: Server | undefined;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'rfg-send-'));
});

afterEach(async () => {
  await new Promise<void>((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
  server = undefined;
  await rm(dir, { recursive: true, force: true });
});

async function serve(file: string): Promise<string> {
  server = createServer((_req, res) => sendFile(res, file, 'text/plain; charset=utf-8'));
  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}/`;
}

describe('sendFile', () => {
  it('streams the file with its content type', async () => {
    const file = path.join(dir, 'hello.txt');
    await writeFile(file, 'hello');
    const response = await fetch(await serve(file));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe('hello');
  });

  it('answers 500 when the file cannot be read and keeps serving', async () => {
    const url = await serve(path.join(dir, 'missing.txt'));
    const first = await fetch(url);
    expect(first.status).toBe(500);
    expect(await first.text()).toBe('Internal server error');
    const second = await fetch(url);
    expect(second.status).toBe(500);
  });
});

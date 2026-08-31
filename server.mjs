import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(root, 'dist', 'client');
const workerPath = path.join(root, 'dist', 'server', 'index.js');
const worker = (await import(workerPath)).default;
const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '10000', 10);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};

const securityHeaders = {
  'content-security-policy':
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  'cross-origin-opener-policy': 'same-origin',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

function applyHeaders(responseHeaders = {}) {
  return { ...responseHeaders, ...securityHeaders };
}

async function serveStatic(pathname, response) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const candidate = path.resolve(clientRoot, `.${decoded}`);
  if (!candidate.startsWith(`${clientRoot}${path.sep}`)) return false;

  try {
    const info = await stat(candidate);
    if (!info.isFile()) return false;
    const body = await readFile(candidate);
    const cacheControl =
      decoded === '/sw.js'
        ? 'no-cache'
        : decoded.startsWith('/_next/static/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600';
    response.writeHead(
      200,
      applyHeaders({
        'cache-control': cacheControl,
        'content-type':
          mimeTypes[path.extname(candidate)] || 'application/octet-stream',
      }),
    );
    response.end(body);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === '/healthz') {
      response.writeHead(
        200,
        applyHeaders({ 'content-type': 'text/plain; charset=utf-8' }),
      );
      response.end('ok');
      return;
    }

    const forwardedProtocol = request.headers['x-forwarded-proto'];
    const protocol =
      typeof forwardedProtocol === 'string'
        ? forwardedProtocol.split(',')[0].trim()
        : 'http';
    const publicHost = request.headers.host || `localhost:${port}`;
    const url = new URL(request.url || '/', `${protocol}://${publicHost}`);

    if (await serveStatic(url.pathname, response)) return;

    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const init = {
      method: request.method,
      headers: request.headers,
      ...(body ? { body, duplex: 'half' } : {}),
    };
    const workerResponse = await worker.fetch(
      new Request(url, init),
      {},
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );
    const headers = Object.fromEntries(workerResponse.headers);
    response.writeHead(workerResponse.status, applyHeaders(headers));
    if (request.method === 'HEAD') response.end();
    else response.end(Buffer.from(await workerResponse.arrayBuffer()));
  } catch (error) {
    console.error('Request failed', error);
    response.writeHead(
      500,
      applyHeaders({ 'content-type': 'text/plain; charset=utf-8' }),
    );
    response.end('Internal server error');
  }
});

server.listen(port, host, () => {
  console.log(`Qraft Sales Trainer listening on ${host}:${port}`);
});

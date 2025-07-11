import { websocketHandler } from './src/websocket/index.ts';
import { handleApiRequest } from './src/api.ts';

const isDev = process.env.NODE_ENV !== 'production';

function log(...args: any[]) {
  if (isDev) {
    console.log(`[${new Date().toISOString()}]`, ...args);
  }
}

const server = Bun.serve({
  port: process.env.PORT || 5000,
  development: isDev,
  async fetch(req, server) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    if (isDev) {
      log(`${method} ${path}`);
    }

    try {
      // Handle WebSocket upgrade
      if (path === '/ws') {
        log('WebSocket upgrade requested');
        const success = server.upgrade(req);
        if (success) {
          log('WebSocket upgrade successful');
          return undefined;
        }
        log('WebSocket upgrade failed');
        return new Response('WebSocket upgrade failed', { status: 400 });
      }

      // Handle API routes
      if (path.startsWith('/api/')) {
        log(`API request: ${method} ${path}`);
        const response = await handleApiRequest(req);
        log(`API response: ${response.status}`);
        return response;
      }

      // Handle static files
      let filePath = path;
      if (filePath === '/') {
        filePath = '/index.html';
        log('Serving index.html');
      }

      const clientPath = import.meta.dir + '/../client';

      // Handle TypeScript/JSX files - let Bun transpile them
      if (
        filePath.endsWith('.tsx') ||
        filePath.endsWith('.ts') ||
        filePath.endsWith('.jsx') ||
        filePath.endsWith('.js')
      ) {
        log(`Transpiling: ${filePath}`);
        const file = Bun.file(clientPath + filePath);
        if (await file.exists()) {
          const transpiled = await Bun.build({
            entrypoints: [clientPath + filePath],
            target: 'browser',
            format: 'esm',
            minify: false,
            sourcemap: 'inline',
            external: [
              'v8',
              'fs',
              'path',
              'util',
              'crypto',
              'stream',
              'events',
              'buffer',
              'os',
              'url',
              'querystring',
              'zlib',
              'http',
              'https',
              'net',
              'tls',
              'cluster',
              'child_process',
              'worker_threads',
              'perf_hooks',
              'async_hooks',
              'inspector',
              'repl',
              'readline',
              'domain',
              'dgram',
              'dns',
              'vm',
              'string_decoder',
              'timers',
              'tty',
              'assert',
              'punycode',
              'constants',
            ],
          });

          if (transpiled.success && transpiled.outputs[0]) {
            log(`Transpilation successful: ${filePath}`);
            return new Response(await transpiled.outputs[0].text(), {
              headers: {
                'Content-Type': 'application/javascript',
              },
            });
          } else {
            log(`Transpilation failed: ${filePath}`, transpiled.logs);
          }
        }
      }

      // Handle CSS files
      if (filePath.endsWith('.css')) {
        log(`Serving CSS: ${filePath}`);
        const file = Bun.file(clientPath + filePath);
        if (await file.exists()) {
          // Process CSS with Tailwind
          const cssContent = await file.text();
          if (cssContent.includes('@tailwind')) {
            try {
              const transpiled = await Bun.build({
                entrypoints: [clientPath + filePath],
                target: 'browser',
                minify: false,
                plugins: [
                  {
                    name: 'tailwind-css',
                    setup(build) {
                      // Simple Tailwind replacement for development
                      build.onLoad({ filter: /\.css$/ }, async (args) => {
                        const text = await Bun.file(args.path).text();
                        const processed = text
                          .replace('@tailwind base;', '/* Base styles */')
                          .replace(
                            '@tailwind components;',
                            '/* Component styles */'
                          )
                          .replace(
                            '@tailwind utilities;',
                            '/* Utility styles */'
                          );
                        return { contents: processed, loader: 'css' };
                      });
                    },
                  },
                ],
              });

              if (transpiled.success && transpiled.outputs[0]) {
                return new Response(await transpiled.outputs[0].text(), {
                  headers: {
                    'Content-Type': 'text/css',
                  },
                });
              }
            } catch (e) {
              log(`CSS processing error: ${e}`);
            }
          }

          return new Response(file, {
            headers: {
              'Content-Type': 'text/css',
            },
          });
        }
      }

      // Handle other static files
      const file = Bun.file(clientPath + filePath);
      if (await file.exists()) {
        log(`Serving static file: ${filePath}`);
        return new Response(file);
      }

      // Fallback for SPA
      log(`Fallback to index.html for: ${filePath}`);
      return new Response(Bun.file(clientPath + '/index.html'));
    } catch (error) {
      log(`Server error for ${method} ${path}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`Server Error: ${message}`, { status: 500 });
    }
  },
  websocket: websocketHandler,
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
if (isDev) {
  console.log('📝 Development mode: Verbose logging enabled');
  console.log('🔄 Hot reloading enabled');
}

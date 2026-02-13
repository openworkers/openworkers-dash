/// <reference types="@openworkers/workers-types" />

interface Env {
  ASSETS: BindingAssets;
  OPENWORKERS_API?: BindingWorker;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    let { pathname } = url;

    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      // ignore invalid URI
    }

    // Proxy /api requests to API worker
    if (pathname.startsWith('/api')) {
      if (!env.OPENWORKERS_API) {
        return new Response('API worker not configured', { status: 500 });
      }

      return env.OPENWORKERS_API.fetch(req);
    }

    // Remove trailing slash (except for root)
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Try to serve the file directly
    let response = await tryServeFile(env, pathname);

    if (response) {
      return addHeaders(response, pathname);
    }

    // SPA fallback to index.html
    response = await tryServeFile(env, '/index.html');

    if (response) {
      return addHeaders(response, '/index.html');
    }

    return new Response('Not Found', { status: 404 });
  }
} satisfies ExportedHandler<Env>;

async function tryServeFile(env: Env, pathname: string): Promise<Response | null> {
  try {
    const response = await env.ASSETS.fetch(pathname);

    if (response.ok) {
      return response;
    }

    return null;
  } catch {
    return null;
  }
}

function addHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);

  if (pathname.startsWith('/assets/')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable');
  } else if (pathname.endsWith('.html')) {
    headers.set('cache-control', 'no-cache');
  } else {
    headers.set('cache-control', 'public, max-age=3600');
  }

  return new Response(response.body, {
    status: response.status,
    headers
  });
}

// This function should be deployed as a serverless/edge function (e.g., on Cloudflare Workers or Vercel).
// It acts as a secure proxy to the Finnhub API.
// Your frontend will make requests to this function's URL.
// Remember to set the FINNHUB_API_KEY environment variable in your deployment settings.

interface Env {
  FINNHUB_API_KEY: string;
}

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

async function handleRequest(request: Request, env: Env) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const searchParams = url.search;

  const apiUrl = `${FINNHUB_BASE_URL}${path}${searchParams}`;
  const finnhubUrl = new URL(apiUrl);
  finnhubUrl.searchParams.set('token', env.FINNHUB_API_KEY);

  // Use Cloudflare's Cache API for caching
  // FIX: Cast `caches` to `any` to access the `default` property. This is a non-standard property
  // available in environments like Cloudflare Workers, and this bypasses the TypeScript type error.
  const cache = (caches as any).default;
  let response = await cache.match(finnhubUrl.toString());

  if (!response) {
    console.log(`Cache miss for: ${finnhubUrl.toString()}`);
    response = await fetch(finnhubUrl.toString(), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
        // Create a new response to modify headers
        response = new Response(response.body, response);
        response.headers.set('Cache-Control', 's-maxage=60'); // Cache for 60 seconds
        
        // waitUntil is specific to some environments like Cloudflare to not block the response
        const promise = cache.put(finnhubUrl.toString(), response.clone());
        if ((globalThis as any).waitUntil) {
             (globalThis as any).waitUntil(promise);
        }
    }
  } else {
     console.log(`Cache hit for: ${finnhubUrl.toString()}`);
  }
  
  // Add CORS headers to allow requests from any origin
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// Exporting a default object with a fetch handler is a common pattern for serverless functions.
export default {
  fetch: handleRequest,
};
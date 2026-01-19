import type { VercelRequest, VercelResponse } from '@vercel/node';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Extract the original path after /api/ from the x-invoke-path header provided by Vercel rewrites.
  // FIX: A request header value can be a string array. Handle this case by taking the first element.
  const rawInvokePath = request.headers['x-invoke-path'];
  const invokePath = (Array.isArray(rawInvokePath) ? rawInvokePath[0] : rawInvokePath) || '';
  const pathString = invokePath.startsWith('/api/') ? invokePath.substring(5) : invokePath;

  if (!pathString) {
    return response.status(400).json({ error: 'Missing API path' });
  }

  // Construct the target Finnhub URL
  const targetUrl = new URL(`${FINNHUB_BASE_URL}/${pathString}`);
  
  // Forward all original query parameters (e.g., symbol, resolution)
  Object.entries(request.query).forEach(([key, value]) => {
    if (value !== undefined) {
      targetUrl.searchParams.set(key, String(value));
    }
  });
  
  // Securely append the API Key on the server-side
  targetUrl.searchParams.set('token', process.env.FINNHUB_API_KEY || '');

  try {
    const apiResponse = await fetch(targetUrl.toString());

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ 
        error: 'Finnhub API Error', 
        status: apiResponse.status,
        details: errorText
      });
    }

    const data = await apiResponse.json();
    
    // Set CORS and Cache headers for performance
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Proxy Error' });
  }
}

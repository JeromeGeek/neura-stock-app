
import type { VercelRequest, VercelResponse } from '@vercel/node';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // path is an array: e.g. ["stock", "profile2"]
  const { path: pathSegments, ...queryParams } = request.query;
  
  if (!pathSegments) {
    return response.status(400).json({ error: 'Missing path' });
  }

  const pathString = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
  
  // Build the target URL for Finnhub
  const targetUrl = new URL(`${FINNHUB_BASE_URL}/${pathString}`);
  
  // Forward all query parameters (symbol, resolution, etc.)
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      targetUrl.searchParams.set(key, String(value));
    }
  });
  
  // Append API Key
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
    
    // Set CORS and Cache headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Proxy Error' });
  }
}

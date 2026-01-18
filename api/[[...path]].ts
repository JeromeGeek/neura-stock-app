
import type { VercelRequest, VercelResponse } from '@vercel/node';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Extract the path after /api/
  const fullUrl = new URL(request.url || '', `http://${request.headers.host}`);
  const path = fullUrl.pathname.replace('/api', '');
  
  // Construct the target Finnhub URL with the same query parameters
  const finnhubUrl = new URL(`${FINNHUB_BASE_URL}${path}`);
  fullUrl.searchParams.forEach((value, key) => {
    finnhubUrl.searchParams.set(key, value);
  });
  
  // Add the API Key
  finnhubUrl.searchParams.set('token', process.env.FINNHUB_API_KEY || '');

  try {
    const apiResponse = await fetch(finnhubUrl.toString());

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      // Handle rate limit specifically
      if (apiResponse.status === 429) {
          return response.status(429).json({ error: 'Rate limit exceeded' });
      }
      return response.status(apiResponse.status).send(errorText);
    }

    const data = await apiResponse.json();
    
    // Set response headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}

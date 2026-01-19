
import type { VercelRequest, VercelResponse } from '@vercel/node';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { path, ...queryParams } = request.query;
  
  // Convert path array/string to a clean string
  const pathString = Array.isArray(path) ? path.join('/') : (path as string) || '';
  
  // Construct URL. Ensure no double slashes.
  const targetUrl = new URL(`${FINNHUB_BASE_URL}/${pathString.replace(/^\//, '')}`);
  
  // Append all query parameters
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      targetUrl.searchParams.set(key, String(value));
    }
  });
  
  // Inject the API Key
  targetUrl.searchParams.set('token', process.env.FINNHUB_API_KEY || '');

  try {
    const apiResponse = await fetch(targetUrl.toString());

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      return response.status(apiResponse.status).json({ 
        error: 'Finnhub API Error', 
        status: apiResponse.status,
        details: errorData 
      });
    }

    const data = await apiResponse.json();
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response.status(200).json(data);
  } catch (error) {
    console.error('Proxy Exception:', error);
    return response.status(500).json({ error: 'Internal Proxy Error' });
  }
}

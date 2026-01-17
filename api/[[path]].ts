
// This serverless function is written for the Vercel Node.js runtime.
// It acts as a secure proxy to the Finnhub API.
import type { VercelRequest, VercelResponse } from '@vercel/node';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  // Vercel populates request.url with the path and query string.
  // We create a new URL object to easily parse it.
  const incomingUrl = new URL(request.url || '', `http://${request.headers.host}`);
  const path = incomingUrl.pathname.replace('/api', '');
  const searchParams = incomingUrl.searchParams;

  // Construct the target Finnhub URL
  const finnhubUrl = new URL(`${FINNHUB_BASE_URL}${path}`);
  finnhubUrl.search = searchParams.toString();
  finnhubUrl.searchParams.set('token', process.env.FINNHUB_API_KEY || '');

  try {
    const apiResponse = await fetch(finnhubUrl.toString());

    // If Finnhub returns an error, forward it to the client
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Finnhub API error (${apiResponse.status}):`, errorText);
      return response.status(apiResponse.status).send(errorText);
    }

    const data = await apiResponse.json();
    
    // Set CORS headers to allow the frontend to call this API
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Set caching headers for Vercel's CDN.
    // Cache successful responses for 60 seconds.
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    // Handle CORS pre-flight requests
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    
    // Send the successful response back to the frontend
    return response.status(200).json(data);

  } catch (error) {
    console.error('Error in API proxy function:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}

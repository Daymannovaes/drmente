import type { VercelRequest, VercelResponse } from "@vercel/node";

// requires a drmente.com?token=1234etc
function auth(req: VercelRequest, res: VercelResponse): boolean {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  const { token } = req.query;

  // Validate token exists in query
  if (!token || typeof token !== 'string') {
    res.status(400).json({
      error: 'Bad request',
      message: 'Token is required'
    });
    return false;
  }

  // Get expected token from environment
  const validToken = process.env.AUTH_API_TOKEN;
  if (!validToken) {
    res.status(500).json({
      error: 'Server configuration error',
      message: 'Auth api token not configured'
    });
    return false;
  }

  // Compare tokens
  if (token !== validToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
    return false;
  }

  return true;
}

export default auth;

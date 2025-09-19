import { VercelRequest, VercelResponse } from '@vercel/node';
import { MemedClient, MemedError } from '../../src';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET and POST methods are supported'
    });
  }

  try {
    // Get the Memed token from environment variables
    const token = process.env.MEMED_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Memed token not configured'
      });
    }

    // Initialize the Memed client
    const memedClient = new MemedClient({ token });

    // Extract search parameters
    let searchParams: {
      filter: string;
      size?: number;
      page?: number;
    };

    if (req.method === 'GET') {
      // For GET requests, extract from query parameters
      const { filter, size, page } = req.query;

      if (!filter || typeof filter !== 'string') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Filter parameter is required'
        });
      }

      searchParams = {
        filter,
        size: size ? parseInt(size as string, 10) : 5,
        page: page ? parseInt(page as string, 10) : 1
      };
    } else {
      // For POST requests, extract from request body
      const { filter, size = 5, page = 1 } = req.body;

      if (!filter || typeof filter !== 'string') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Filter parameter is required in request body'
        });
      }

      searchParams = {
        filter,
        size: typeof size === 'number' ? size : parseInt(size, 10),
        page: typeof page === 'number' ? page : parseInt(page, 10)
      };
    }

    // Validate search parameters
    if (searchParams.size && (searchParams.size < 1 || searchParams.size > 100)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Size must be between 1 and 100'
      });
    }

    if (searchParams.page && searchParams.page < 1) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Page must be greater than 0'
      });
    }

    // Search patients using the SDK
    const results = await memedClient.searchPatients(searchParams);

    // Return the results
    return res.status(200).json({
      success: true,
      data: results,
      meta: {
        filter: searchParams.filter,
        size: searchParams.size,
        page: searchParams.page
      }
    });

  } catch (error) {
    console.error('Error searching patients:', error);

    // Handle Memed-specific errors
    if (error instanceof MemedError) {
      return res.status(error.status).json({
        error: 'Memed API error',
        message: error.message,
        details: {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        }
      });
    }

    // Handle other errors
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while searching patients'
    });
  }
}

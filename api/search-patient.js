import { M as MemedClient, a as MemedError } from "./client-DjwK6qim.js";
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only GET and POST methods are supported"
    });
  }
  try {
    const token = process.env.MEMED_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: "Server configuration error",
        message: "Memed token not configured"
      });
    }
    const memedClient = new MemedClient({ token });
    let searchParams;
    if (req.method === "GET") {
      const { filter, size, page } = req.query;
      if (!filter || typeof filter !== "string") {
        return res.status(400).json({
          error: "Bad request",
          message: "Filter parameter is required"
        });
      }
      searchParams = {
        filter,
        size: size ? parseInt(size, 10) : 5,
        page: page ? parseInt(page, 10) : 1
      };
    } else {
      const { filter, size = 5, page = 1 } = req.body;
      if (!filter || typeof filter !== "string") {
        return res.status(400).json({
          error: "Bad request",
          message: "Filter parameter is required in request body"
        });
      }
      searchParams = {
        filter,
        size: typeof size === "number" ? size : parseInt(size, 10),
        page: typeof page === "number" ? page : parseInt(page, 10)
      };
    }
    if (searchParams.size && (searchParams.size < 1 || searchParams.size > 100)) {
      return res.status(400).json({
        error: "Bad request",
        message: "Size must be between 1 and 100"
      });
    }
    if (searchParams.page && searchParams.page < 1) {
      return res.status(400).json({
        error: "Bad request",
        message: "Page must be greater than 0"
      });
    }
    const results = await memedClient.searchPatients(searchParams);
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
    console.error("Error searching patients:", error);
    if (error instanceof MemedError) {
      return res.status(error.status).json({
        error: "Memed API error",
        message: error.message,
        details: {
          status: error.status,
          statusText: error.statusText,
          url: error.url
        }
      });
    }
    return res.status(500).json({
      error: "Internal server error",
      message: "An unexpected error occurred while searching patients"
    });
  }
}
export {
  handler as default
};

function auth(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false;
  }
  const { token } = req.query;
  if (!token || typeof token !== "string") {
    res.status(400).json({
      error: "Bad request",
      message: "Token is required"
    });
    return false;
  }
  const validToken = process.env.AUTH_API_TOKEN;
  if (!validToken) {
    res.status(500).json({
      error: "Server configuration error",
      message: "Auth api token not configured"
    });
    return false;
  }
  if (token !== validToken) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token"
    });
    return false;
  }
  return true;
}
export {
  auth as a
};

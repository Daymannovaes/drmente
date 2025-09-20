class MemedError extends Error {
  constructor(message, meta) {
    super(message);
    this.name = "MemedError";
    this.status = meta.status;
    this.statusText = meta.statusText;
    this.url = meta.url;
    this.requestBody = meta.body;
    this.response = meta.response;
  }
}
function buildUrl(baseURL, path, query) {
  const url = new URL(baseURL.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path));
  if (query) applyQuery(url, query);
  return url;
}
function applyQuery(url, query) {
  for (const [k, v] of Object.entries(query)) {
    if (v === void 0 || v === null) continue;
    url.searchParams.set(k, String(v));
  }
}
async function requestJSON(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new MemedError(
      `HTTP ${res.status} ${res.statusText}`,
      { status: res.status, statusText: res.statusText, url: url.toString(), body: init.body, response: data }
    );
  }
  return data;
}
class MemedClient {
  constructor({ token, baseURL = "https://gateway.memed.com.br", defaultHeaders = {} }) {
    if (!token) throw new Error("MemedClient: `token` is required");
    this.token = token;
    this.baseURL = baseURL;
    this.defaultHeaders = {
      accept: "application/json",
      "content-type": "application/json",
      ...defaultHeaders
    };
  }
  /** Create a patient (POST /v2/patient-management/patients) */
  async createPatient(patient, opts = {}) {
    const url = buildUrl(this.baseURL, "/v2/patient-management/patients");
    return requestJSON(url, {
      method: "POST",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...opts.headers ?? {}, "x-token": this.token },
      body: JSON.stringify(patient)
    });
  }
  /** Search patients (GET /v2/patient-management/patients/search) */
  async searchPatients(params, opts = {}) {
    const { filter, size = 5, page = 1 } = params;
    if (!filter) throw new Error("searchPatients: `filter` is required");
    const url = buildUrl(this.baseURL, "/v2/patient-management/patients/search", { filter, size, page });
    return requestJSON(url, {
      method: "GET",
      signal: opts.signal,
      headers: { ...this.defaultHeaders, ...opts.headers ?? {}, "x-token": this.token }
    });
  }
}
function auth(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
  MemedClient as M,
  auth as a,
  MemedError as b
};

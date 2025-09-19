import type { QueryString } from "./models/common";

export class MemedError extends Error {
  status: number;
  statusText: string;
  url: string;
  requestBody: unknown;
  response: unknown;

  constructor(message: string, meta: { status: number; statusText: string; url: string; body: unknown; response: unknown }) {
    super(message);
    this.name = "MemedError";
    this.status = meta.status;
    this.statusText = meta.statusText;
    this.url = meta.url;
    this.requestBody = meta.body;
    this.response = meta.response;
  }
}

/** Build a fully qualified URL from base, path and query */
export function buildUrl(baseURL: string, path: string, query?: QueryString): URL {
  const url = new URL(baseURL.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path));
  if (query) applyQuery(url, query);
  return url;
}

/** Apply a query object to an existing URL */
export function applyQuery(url: URL, query: QueryString): void {
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
}

/** Internal fetch wrapper with helpful errors */
export async function requestJSON<T = unknown>(
  url: URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    throw new MemedError(`HTTP ${res.status} ${res.statusText}`,
      { status: res.status, statusText: res.statusText, url: url.toString(), body: init.body, response: data }
    );
  }
  return data as T;
}

/** Convenience to create a timeout AbortSignal */
export function timeoutSignal(ms = 10_000): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(new Error("Request timed out")), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
}

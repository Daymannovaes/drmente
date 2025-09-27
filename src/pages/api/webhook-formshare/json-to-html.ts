/**
 * Convert JSON (object or string) into a simple HTML string,
 * where each line is wrapped in <p>…</p> with safe escaping.
 *
 * @param {object|string} input - A JSON object or a JSON string.
 * @param {object} [opts]
 * @param {boolean} [opts.escapeSlashes=true] - Replace "/" with "\/" inside text.
 * @param {boolean} [opts.escapeQuotes=false] - Replace quotes with \" and \'.
 * @param {number|null} [opts.indent=2] - Indentation passed to JSON.stringify; set to null to keep as-is if input is string.
 * @returns {string} HTML string.
 */
export function jsonToSimpleHtml(input: object | string, {
  escapeSlashes = true,
  escapeQuotes  = false,
  indent        = 2
} = {}) {
  // Normalize to a pretty-printed JSON string
  let jsonStr;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      jsonStr = JSON.stringify(parsed, null, indent ?? 2);
    } catch {
      // If not valid JSON, use as-is (optionally keep original indentation)
      jsonStr = indent == null ? input : input;
    }
  } else {
    jsonStr = JSON.stringify(input, null, indent ?? 2);
  }

  jsonStr = jsonStr
  .split(/\r?\n/)
  .map(line => line.replace(/^(\s+)/, spaces => '⠀'.repeat(spaces.length)))
  .join('\n');

  // HTML-escape and optionally slash/quote-escape the content per line
  const escapeHtml = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

  const contentEscapes = (s: string) => {
    let out = s;
    if (escapeSlashes) out = out.replaceAll('/', '\\/');
    if (escapeQuotes)  out = out.replaceAll('"', '\\"').replaceAll("'", "\\'");
    return out;
  };

  return jsonStr
    .split(/\r?\n/)
    .map(line => `<p>${contentEscapes(escapeHtml(line))}</p>`)
    .join('');
}

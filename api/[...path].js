const skippedRequestHeaders = new Set(['host', 'content-length', 'connection']);
const skippedResponseHeaders = new Set(['content-length', 'content-encoding', 'transfer-encoding', 'connection']);

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

module.exports = async function handler(req, res) {
  try {
    const backend = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
    const base = backend.endsWith('/api') ? backend : `${backend}/api`;
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const apiPath = requestUrl.pathname.replace(/^\/api/, '') || '/';
    const target = `${base}${apiPath}${requestUrl.search}`;

    const headers = {};
    for (const [name, value] of Object.entries(req.headers || {})) {
      if (!skippedRequestHeaders.has(name.toLowerCase())) {
        headers[name] = value;
      }
    }

    let body;
    if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    } else if (!['GET', 'HEAD'].includes(req.method)) {
      body = await readBody(req);
    }

    const response = await fetch(target, {
      method: req.method,
      headers,
      body
    });

    for (const [name, value] of response.headers) {
      if (!skippedResponseHeaders.has(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    }

    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.status(502).json({ message: 'API proxy failed', detail: error.message });
  }
};

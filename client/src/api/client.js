let privateToken = null;

export function setPrivateToken(token) {
  privateToken = token;
}

export function clearPrivateToken() {
  privateToken = null;
}

export function hasPrivateToken() {
  return !!privateToken;
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (privateToken) headers['X-Private-Token'] = privateToken;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(body?.error || `שגיאת שרת (${res.status})`);
  }
  return body;
}

export function apiGet(path) {
  return request(path);
}

export function apiPostJson(path, data) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function apiPostForm(path, formData) {
  return request(path, { method: 'POST', body: formData });
}

export function apiPutJson(path, data) {
  return request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}

/** fetch() for the builder's own API that sends the signed-in merchant's token (the server takes the store from it). */
export function builderToken(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('token') || localStorage.getItem('orcayo_access_token') || '';
}

export function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = builderToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...init, headers });
}

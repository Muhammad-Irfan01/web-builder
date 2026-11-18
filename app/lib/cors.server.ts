import { configuredOrigins, DASHBOARD_URL } from './origins';

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

export function getCorsHeaders(request: Request): Headers {
  const origin = request.headers.get("Origin") || request.headers.get("origin");
  const headers = new Headers();

  const isAllowed = origin && (
    ALLOWED_ORIGINS.includes(origin) || configuredOrigins().includes(origin)
  );

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin!);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-store-id, x-branch-id, x-session-id, x-api-key");
    headers.set("Vary", "Origin");
  } else if (!origin) {
    // Standard server-to-server or direct fetches
    headers.set("Access-Control-Allow-Origin", "*");
  } else {
    // Secure fallback origin
    headers.set("Access-Control-Allow-Origin", DASHBOARD_URL);
  }

  return headers;
}

export function handlePreflight(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }
  return null;
}

export function jsonWithCors(data: any, request: Request, init?: ResponseInit): Response {
  const corsHeaders = getCorsHeaders(request);
  const responseInit = init || {};
  const responseHeaders = new Headers(responseInit.headers);

  corsHeaders.forEach((value, key) => {
    responseHeaders.set(key, value);
  });

  return Response.json(data, {
    ...responseInit,
    headers: responseHeaders,
  });
}

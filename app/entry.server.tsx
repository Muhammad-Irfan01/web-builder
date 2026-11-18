import { initPopupCron } from "./lib/popup-cron.server";

// Start popup store background cron runner
initPopupCron();

import type { EntryContext } from "react-router";
import { configuredOrigins } from "./lib/origins";
import { ServerRouter } from "react-router";
import { renderToReadableStream } from "react-dom/server";
import { isbot } from "isbot";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3030",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3030",
  "http://127.0.0.1:5173",
];

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("Origin") || request.headers.get("origin");
  const headers = new Headers();

  // Allow null origin or missing origin (standard for many local/server requests)
  const isAllowed = !origin || origin === "null" || 
    ALLOWED_ORIGINS.includes(origin) || 
    configuredOrigins().includes(origin);

  console.log(`[CORS] Request Origin: ${origin}, Allowed: ${!!isAllowed}`);

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin && origin !== "null" ? origin : "*");
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-store-id, x-branch-id, x-session-id, x-api-key");
    headers.set("Vary", "Origin");
  }

  return headers;
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  // ── IMPORTANT: Handle OPTIONS Preflight globally ──────────────────────────
  // This intercepts OPTIONS before they hit ANY loader or action.
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }

  const corsHeaders = getCorsHeaders(request);
  corsHeaders.forEach((value, key) => {
    responseHeaders.set(key, value);
  });

  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  if (isbot(userAgent)) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export function handleDataRequest(
  response: Response,
  { request }: { request: Request }
) {
  const corsHeaders = getCorsHeaders(request);

  // Global intercept for API preflights
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Create a new response with merged headers
  const newHeaders = new Headers(response.headers);
  corsHeaders.forEach((value, key) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export function handleError(
  error: unknown,
  { request }: { request: Request }
) {
  const corsHeaders = getCorsHeaders(request);
  console.error('[ServerError]', error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }),
    {
      status: 500,
      headers: {
        ...Object.fromEntries(corsHeaders.entries()),
        'Content-Type': 'application/json'
      }
    }
  );
}

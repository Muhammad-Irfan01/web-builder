import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

export async function action() {
  return new Response("Method Not Allowed", { status: 405 });
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status  = 500;
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status  = error.status;
    message = status === 404 ? "404 — Not Found" : `Error ${status}`;
    details = status === 404
      ? "The page you're looking for doesn't exist."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack   = error.stack;
  } else if (error instanceof Error) {
    details = error.message;
    stack   = error.stack;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      padding: '40px',
      background: 'var(--color-bg)',
      color: 'var(--color-text-primary)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ fontSize: '3rem' }}>{status === 404 ? '🔍' : '⚠️'}</div>
      <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>{message}</h1>
      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '400px' }}>{details}</p>
      {stack && (
        <pre style={{
          background: 'var(--color-surface-1)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '20px',
          fontSize: '0.75rem',
          overflow: 'auto',
          maxWidth: '700px',
          width: '100%',
          color: 'var(--color-brand-light)',
        }}>
          {stack}
        </pre>
      )}
      <a href="/" style={{
        padding: '10px 20px',
        background: 'var(--color-brand)',
        color: '#fff',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        marginTop: '8px',
      }}>
        ← Back to Home Page
      </a>
    </div>
  );
}

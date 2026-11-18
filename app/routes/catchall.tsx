import type { Route } from "./+types/catchall";

const SUSPICIOUS_PATTERNS = [
  /\.env/i,
  /wp-/i,
  /xmlrpc/i,
  /cgi-bin/i,
  /\.git/i,
  /actuator/i,
  /config/i,
  /setup/i,
  /phpinfo/i,
  /phpmyadmin/i,
  /wlwmanifest/i,
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const isSuspicious = SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(pathname));

  if (isSuspicious) {
    console.warn(`[Security] Blocked suspicious request: ${pathname} from IP: ${request.headers.get("x-real-ip") || "unknown"}`);
    return Response.json({ error: "Access Forbidden" }, { status: 403 });
  }

  return Response.json({ error: "Page Not Found" }, { status: 404 });
}

export default function Catchall() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      fontFamily: "sans-serif", 
      backgroundColor: "#0a0d1a", 
      color: "#fff" 
    }}>
      <h1 style={{ fontSize: "3rem", margin: "0 0 10px 0", color: "#ff4e2a" }}>404</h1>
      <p style={{ color: "#8c9ba5" }}>The requested page does not exist.</p>
    </div>
  );
}

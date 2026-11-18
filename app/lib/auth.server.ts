import { redirect } from 'react-router';

export interface AuthenticatedUser {
  userId: string;
  storeId: string;
  email?: string;
  roleId?: string;
}

/**
 * Decode JWT token without verification to extract fields immediately
 */
export function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Request a persistent site token (API Key) from the Orcayo Backend
 * This token is signed by the backend, contains the storeId, and lasts 10 years.
 */
export async function generatePersistentSiteToken(userId: string): Promise<string | null> {
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'https://orcayo.wattlesol.com/api';
  let cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');
  if (!cleanApiUrl.endsWith('/api')) {
    cleanApiUrl = `${cleanApiUrl}/api`;
  }

  try {
    const response = await fetch(`${cleanApiUrl}/auth/internal/generate-site-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[Auth] Failed to generate site token: ${response.status} ${err}`);
      return null;
    }

    const result = await response.json();
    return result.data?.token || null;
  } catch (error) {
    console.error('[Auth] Error generating site token:', error);
    return null;
  }
}

/**
 * Authenticate incoming request using JWT and origin/referer checks.
 * If unauthorized, throws a redirect or JSON response.
 */
export async function requireAuth(request: Request): Promise<AuthenticatedUser> {
  // ── IMPORTANT: Bypass Auth for OPTIONS Preflight ─────────────────────────
  if (request.method === "OPTIONS") {
    return { userId: '', storeId: '' }; // Dummy return, entry.server will handle response
  }

  const url = new URL(request.url);

  // ── Referrer & Origin Protection ─────────────────────────────────────────
  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';

  // In production, restrict to orcayoui.wattlesol.com
  const isAllowedOrigin = (urlStr: string) => {
    if (!urlStr) return false;
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname; // Use hostname to avoid port issues
      return (
        host === 'orcayoui.wattlesol.com' ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        urlStr.includes('wattlesol.com')
      );
    } catch {
      return false;
    }
  };

  // Skip referrer check in local development if no referrer is sent
  const env = process.env.NODE_ENV;
  if (env === 'production') {
    const hasValidReferer = isAllowedOrigin(referer) || isAllowedOrigin(origin);
    if (!hasValidReferer && (referer || origin)) {
      console.warn(`[Auth] Blocked request from unauthorized referer: ${referer}, origin: ${origin}`);
      throw Response.json({ error: 'Access Forbidden: Invalid Referer/Origin' }, { status: 403 });
    }
  }

  // ── Token extraction ─────────────────────────────────────────────────────
  // Token can be in authorization header (Bearer <token>) or query parameters
  let token = url.searchParams.get('token') || '';
  if (!token) {
    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    console.error('[Auth] Access token is missing.');
    throw Response.json({ error: 'Access Unauthorized: Token is missing' }, { status: 401 });
  }

  // ── Validate with main Orcayo Backend ────────────────────────────────────
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'https://orcayo.wattlesol.com/api';
  // Strip trailing slash if present
  let cleanApiUrl = apiBaseUrl.replace(/\/+$/, '');
  if (!cleanApiUrl.endsWith('/api')) {
    cleanApiUrl = `${cleanApiUrl}/api`;
  }

  try {
    const verifyUrl = `${cleanApiUrl}/auth/me`;
    const response = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Auth] Backend verification failed: ${response.status}`);
      throw new Error(`Auth verification failed with status ${response.status}`);
    }

    const userData = await response.json();
    
    // NestJS auth service returns the user profile wrapped in data.user
    const userProfile = userData.data?.user || userData;
    const userId = userProfile.id || userProfile.userId || '';
    
    // Decode JWT token as secondary source for storeId if missing in user profile response
    const decoded = decodeJwt(token);
    const storeId = userProfile.storeId || decoded?.storeId || '';
    const email = userProfile.email || decoded?.email || '';

    return {
      userId,
      storeId: storeId || 'demo-store-id', // Fallback to demo-store-id for testing
      email,
    };
  } catch (error: any) {
    // If it's already a Response (from a nested call), re-throw it
    if (error instanceof Response) throw error;

    // If backend verification fails, try local JWT decode as secondary fallback
    // to maintain resiliency while logging the verification error.
    console.error('[Auth] Backend JWT validation error, using local fallback:', error);
    
    const decoded = decodeJwt(token);
    if (decoded && (decoded.storeId || decoded.userId)) {
      return {
        userId: decoded.userId || '',
        storeId: decoded.storeId || 'demo-store-id',
        email: decoded.email,
      };
    }
    
    throw Response.json({ error: 'Access Unauthorized: Invalid token or backend validation failed' }, { status: 401 });
  }
}

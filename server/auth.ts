import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Supabase JWT verification for API requests.
 *
 * Expects a Supabase access token in:
 *   Authorization: Bearer <token>
 *
 * IMPORTANT:
 * - Uses Supabase's PUBLIC JWKS endpoint:
 *   https://<project>.supabase.co/auth/v1/.well-known/jwks.json
 * - Do NOT use /auth/v1/keys unless you also pass apikey (often 401s)
 */

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  console.warn("[auth] SUPABASE_URL is not set. Auth-protected routes will fail.");
}

const jwksUrl = supabaseUrl
  ? new URL("/auth/v1/.well-known/jwks.json", supabaseUrl)
  : null;

const JWKS = jwksUrl ? createRemoteJWKSet(jwksUrl) : null;

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      authPayload?: JWTPayload;
    }
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return token || null;
}

/**
 * Express middleware: validates Supabase JWT and populates req.user.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!JWKS) {
      return res.status(500).json({
        error: "Auth is not configured on the server (SUPABASE_URL missing).",
      });
    }

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ["RS256", "ES256"],
      issuer: supabaseUrl || undefined,
    });

    const sub = payload.sub;
    if (!sub) {
      return res.status(401).json({ error: "Invalid token (missing sub)" });
    }

    req.authPayload = payload;
    req.user = {
      id: sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };

    return next();
  } catch (err: any) {
    console.error("[auth] Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

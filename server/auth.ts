// server/auth.ts
import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type AuthedUser = {
  id: string;           // normalized from JWT `sub`
  email?: string;
  payload: JWTPayload;  // raw jwt payload (if you need it later)
};

export type AuthedRequest = Request;

// Extend Express Request typing (optional but nice)
declare global {
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.warn("[auth] Missing SUPABASE_URL env var. Token verification will fail.");
}

const JWKS_URL = SUPABASE_URL
  ? new URL("/auth/v1/.well-known/jwks.json", SUPABASE_URL)
  : null;

const JWKS = JWKS_URL ? createRemoteJWKSet(JWKS_URL) : null;

// Supabase issuer is always: `${SUPABASE_URL}/auth/v1`
const ISSUER = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1` : null;

// Supabase access tokens normally use aud matches the env var
const AUDIENCE = process.env.SUPABASE_JWT_AUD;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: "Missing Authorization token" });
    }

    if (!JWKS || !ISSUER) {
      return res.status(500).json({ error: "Server auth misconfigured (missing SUPABASE_URL)" });
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    // ✅ Normalize userId from JWT `sub` so your routes can use req.user.id safely
    const userId = payload.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token (missing sub)" });
    }

    req.user = {
      id: String(userId),
      email: typeof payload.email === "string" ? payload.email : undefined,
      payload,
    };

    return next();
  } catch (err: any) {
    console.error("[auth] Token verification failed:", err?.message || err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

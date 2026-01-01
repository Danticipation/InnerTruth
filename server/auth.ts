import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const supabaseUrl = process.env.SUPABASE_URL;
const aud = process.env.SUPABASE_JWT_AUD || "authenticated";

if (!supabaseUrl) {
  console.warn("[auth] SUPABASE_URL is not set. Auth middleware will fail.");
}

const JWKS = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/keys`))
  : null;

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string | null;
    }
  }
}

export interface AuthedRequest extends Request {
  user?: Express.User;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }

    if (!JWKS) {
      return res
        .status(500)
        .json({ error: "Server auth misconfigured (missing SUPABASE_URL)" });
    }

    const token = header.slice("Bearer ".length);

    const { payload } = await jwtVerify(token, JWKS, {
      audience: aud,
    });

    const sub = payload.sub;
    if (!sub || typeof sub !== "string") {
      return res.status(401).json({ error: "Invalid token: missing sub" });
    }

    req.user = {
      id: sub,
      email: typeof payload.email === "string" ? payload.email : null,
    };

    return next();
  } catch (err) {
    console.error("[auth] Token verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config";

/**
 * Express entrypoint.
 * - Enables CORS for local Vite dev server (5173) + optional env override.
 * - Captures rawBody for any webhook-style routes that may need it.
 * - Registers API routes and then mounts Vite/static serving.
 */

process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

const app = express();

/** Capture raw body (useful for webhooks / signature verification). */
declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).rawBody = buf;
    },
    limit: "2mb",
  })
);

app.use(express.urlencoded({ extended: false, limit: "2mb" }));

/**
 * CORS
 * Frontend dev server typically runs on http://localhost:5173
 * In production, you should set CORS_ORIGIN to your deployed frontend URL.
 */
const corsOrigins = config.CORS_ORIGIN
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

/** Minimal request logger (keeps your existing log util). */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined;

  const originalResJson = res.json.bind(res);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).json = (bodyJson: any, ...args: any[]) => {
    capturedJsonResponse = bodyJson;
    return (originalResJson as any)(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Skip super noisy assets in dev
    if (path.startsWith("/assets") || path.includes("favicon")) return;

    const line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    log(line);
  });

  next();
});

(async () => {
  const server = createServer(app);

  await registerRoutes(app);

  // Centralized error handler (always AFTER routes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, _req: any, res: any, _next: any) => {
    const isProduction = app.get("env") === "production";
    const status = err?.statusCode ?? err?.status ?? 500;
    const code = err?.code ?? "INTERNAL_ERROR";
    const message = err?.message ?? "Internal Server Error";

    console.error(`[express] error: ${err.method} ${err.path}`, {
      status,
      code,
      message,
      stack: isProduction ? undefined : err.stack,
    });

    res.status(status).json({
      error: {
        message: isProduction && status === 500 ? "An unexpected error occurred" : message,
        code,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve on PORT (default 5000). This serves both API + client.
  const port = config.PORT;
  server.listen(port, () => {
    console.log(`serving on port ${port}`);
  });
})();

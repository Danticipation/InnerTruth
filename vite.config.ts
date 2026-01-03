import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE:
// This is the ROOT vite config.
// If you have a separate Vite project inside /client,
// you should generally NOT need this config at the root unless the root runs Vite too.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    pool: "threads",
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});

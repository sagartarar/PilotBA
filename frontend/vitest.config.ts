import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Use 'forks' pool to avoid NODE_OPTIONS worker thread restrictions
    // This fixes: "Error: --openssl-config= is not allowed in NODE_OPTIONS"
    pool: "forks",
    poolOptions: {
      forks: {
        // Use single fork for stability with problematic NODE_OPTIONS
        singleFork: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/*",
        "dist/",
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "e2e"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

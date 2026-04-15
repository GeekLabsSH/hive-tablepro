import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [["**/*.test.tsx", "jsdom"]],
    include: ["core/**/*.test.ts", "core/**/*.test.tsx", "src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 15000
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src")
    }
  }
});

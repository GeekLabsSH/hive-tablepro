import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { hiveTableproDebugIngestPlugin } from "./vite/hive-tablepro-debug-ingest-plugin";

/** App de demonstração local (não publicado no pacote npm). */
export default defineConfig({
  plugins: [react(), hiveTableproDebugIngestPlugin()],
  root: path.resolve(__dirname, "playground"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    port: 5173,
    open: true
  }
});

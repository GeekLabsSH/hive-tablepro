import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

/**
 * Middleware de desenvolvimento: `POST /__hive_tablepro_debug_ingest` com corpo JSON (uma linha NDJSON)
 * anexa a `.cursor/debug-7fb25d.log` no workspace (preferindo `../.cursor` quando o CWD é uma pasta filha, ex. `hive-tablepro-src` dentro de `Hive`).
 */
export function hiveTableproDebugIngestPlugin(): Plugin {
  return {
    name: "hive-tablepro-debug-ingest",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "POST" || req.url !== "/__hive_tablepro_debug_ingest") {
          next();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          try {
            const parentCursor = path.join(process.cwd(), "..", ".cursor");
            const logFile = fs.existsSync(parentCursor)
              ? path.join(parentCursor, "debug-7fb25d.log")
              : path.join(process.cwd(), ".cursor", "debug-7fb25d.log");
            fs.mkdirSync(path.dirname(logFile), { recursive: true });
            fs.appendFileSync(logFile, `${body}\n`, "utf8");
          } catch (e) {
            console.error("[hive-tablepro-debug-ingest]", e);
          }
          res.statusCode = 204;
          res.end();
        });
      });
    }
  };
}

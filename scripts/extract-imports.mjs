import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const BUILTIN = new Set([
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "readline",
  "repl",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "worker_threads",
  "zlib",
]);

const pkgs = new Set();

function addSpec(spec) {
  if (!spec || spec.startsWith(".") || spec.startsWith("/")) return;
  if (spec.startsWith("@/")) return;
  if (spec.startsWith("@cronoslogistics/hive-tablepro")) return;
  const pkg = spec.startsWith("@")
    ? spec.split("/").slice(0, 2).join("/")
    : spec.split("/")[0];
  if (BUILTIN.has(pkg)) return;
  // Documentação JSDoc/comentários citam @mui/*; o código usa @cronoslogistics/hive-tablepro/*
  if (pkg.startsWith("@mui/")) return;
  pkgs.add(pkg);
}

/** Matches `from 'x'` / `from "x"` anywhere (incl. multiline import blocks). */
const fromRe = /\bfrom\s+['"]([^'".\/][^'"]*)['"]/g;

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === "scripts")
        continue;
      walk(p);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(e.name)) {
      let s;
      try {
        s = fs.readFileSync(p, "utf8");
      } catch {
        continue;
      }
      let m;
      while ((m = fromRe.exec(s)) !== null) {
        addSpec(m[1]);
      }
    }
  }
}

walk(root);
console.log([...pkgs].sort().join("\n"));

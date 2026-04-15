import { createHash } from "crypto";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const pkgRoot = path.join(__dirname, "..");
export const defaultLegacyRoot = path.join(pkgRoot, "..", "_reference", "hive-tablepro-legacy");
export const legacyRoot = process.env.HIVE_TABLEPRO_LEGACY_ROOT || defaultLegacyRoot;
export const rewriteRoot = path.join(pkgRoot, "legacy-rewrite");
export const outDir = path.join(pkgRoot, "docs", "_generated");
export const zeroJsonPath = path.join(outDir, "legacy-bigbang-zero-scan.json");
export const contractJsonPath = path.join(outDir, "legacy-bigbang-contract-report.json");
export const finalReportPath = path.join(pkgRoot, "docs", "LEGACY_BIGBANG_PARITY_REPORT.md");

export function ensureLegacyRepo() {
  const ensureScript = path.join(pkgRoot, "scripts", "ensure-legacy-hive-tablepro.mjs");
  execSync(`node "${ensureScript}"`, { cwd: pkgRoot, stdio: "inherit" });
}

export function gitLsFiles(root) {
  if (!fs.existsSync(path.join(root, ".git"))) return [];
  const out = execSync("git ls-files", { cwd: root, encoding: "utf8" });
  return out
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((f) => /\.(tsx?|jsx?)$/i.test(f))
    .sort((a, b) => a.localeCompare(b));
}

export function sha1File(absPath) {
  const buf = fs.readFileSync(absPath);
  return createHash("sha1").update(buf).digest("hex");
}

export function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

export function isCodeFile(rel) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(rel);
}


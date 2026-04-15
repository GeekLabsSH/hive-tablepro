import fs from "fs";
import path from "path";
import {
  contractJsonPath,
  ensureLegacyRepo,
  gitLsFiles,
  isCodeFile,
  legacyRoot,
  outDir,
  rewriteRoot,
  toPosix
} from "./legacy-bigbang-common.mjs";
import { extractExportedSymbols } from "./extract-ts-exports.mjs";

function norm(list) {
  return [...new Set(list)].sort((a, b) => a.localeCompare(b));
}

function main() {
  ensureLegacyRepo();
  fs.mkdirSync(outDir, { recursive: true });
  const legacyFiles = gitLsFiles(legacyRoot);

  const rows = [];
  let checked = 0;
  for (const rel of legacyFiles) {
    if (!isCodeFile(rel)) continue;
    const src = path.join(legacyRoot, rel);
    const dst = path.join(rewriteRoot, rel);
    checked += 1;

    if (!fs.existsSync(dst)) {
      rows.push({
        legacy_path: toPosix(rel),
        target_exists: false,
        export_parity: false,
        missing_exports: [],
        extra_exports: []
      });
      continue;
    }

    let srcText = "";
    let dstText = "";
    try {
      srcText = fs.readFileSync(src, "utf8");
      dstText = fs.readFileSync(dst, "utf8");
    } catch {
      rows.push({
        legacy_path: toPosix(rel),
        target_exists: true,
        export_parity: false,
        missing_exports: ["__unreadable_or_binary__"],
        extra_exports: []
      });
      continue;
    }

    const srcExports = norm(extractExportedSymbols(src, srcText));
    const dstExports = norm(extractExportedSymbols(dst, dstText));
    const dstSet = new Set(dstExports);
    const srcSet = new Set(srcExports);
    const missing = srcExports.filter((x) => !dstSet.has(x));
    const extra = dstExports.filter((x) => !srcSet.has(x));

    rows.push({
      legacy_path: toPosix(rel),
      target_exists: true,
      export_parity: missing.length === 0 && extra.length === 0,
      missing_exports: missing,
      extra_exports: extra
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    legacyRoot,
    rewriteRoot,
    code_files_checked: checked,
    export_parity_ok: rows.filter((r) => r.export_parity).length,
    export_parity_fail: rows.filter((r) => !r.export_parity).length,
    rows
  };

  fs.writeFileSync(contractJsonPath, JSON.stringify(payload, null, 2), "utf8");
  console.log("Wrote", contractJsonPath);
  console.log(
    `code_checked=${payload.code_files_checked} parity_ok=${payload.export_parity_ok} parity_fail=${payload.export_parity_fail}`
  );
  if (payload.export_parity_fail > 0) process.exit(2);
}

main();


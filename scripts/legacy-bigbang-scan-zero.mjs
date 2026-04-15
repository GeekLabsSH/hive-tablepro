import fs from "fs";
import path from "path";
import {
  contractJsonPath,
  ensureLegacyRepo,
  gitLsFiles,
  legacyRoot,
  outDir,
  rewriteRoot,
  sha1File,
  toPosix,
  zeroJsonPath
} from "./legacy-bigbang-common.mjs";

function main() {
  ensureLegacyRepo();
  const legacyFiles = gitLsFiles(legacyRoot);
  fs.mkdirSync(outDir, { recursive: true });

  const rows = legacyFiles.map((rel) => {
    const legacyAbs = path.join(legacyRoot, rel);
    const targetRel = toPosix(path.join("legacy-rewrite", rel));
    const targetAbs = path.join(rewriteRoot, rel);
    const targetExists = fs.existsSync(targetAbs);
    return {
      legacy_path: toPosix(rel),
      target_path: targetRel,
      legacy_sha1: sha1File(legacyAbs),
      target_exists: targetExists,
      target_sha1: targetExists ? sha1File(targetAbs) : null,
      literal_match: targetExists ? sha1File(legacyAbs) === sha1File(targetAbs) : false
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    legacyRoot,
    rewriteRoot,
    legacy_count: rows.length,
    mapped_count: rows.filter((r) => r.target_exists).length,
    literal_match_count: rows.filter((r) => r.literal_match).length,
    rows
  };

  fs.writeFileSync(zeroJsonPath, JSON.stringify(payload, null, 2), "utf8");
  // limpar relatório de contrato anterior para forçar regeneração correta no fluxo
  if (fs.existsSync(contractJsonPath)) fs.unlinkSync(contractJsonPath);
  console.log("Wrote", zeroJsonPath);
  console.log(
    `legacy=${payload.legacy_count} mapped=${payload.mapped_count} literal=${payload.literal_match_count}`
  );
}

main();


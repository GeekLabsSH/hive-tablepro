import fs from "fs";
import path from "path";
import {
  ensureLegacyRepo,
  gitLsFiles,
  legacyRoot,
  rewriteRoot
} from "./legacy-bigbang-common.mjs";

function main() {
  ensureLegacyRepo();
  const legacyFiles = gitLsFiles(legacyRoot);
  fs.mkdirSync(rewriteRoot, { recursive: true });

  let copied = 0;
  for (const rel of legacyFiles) {
    const src = path.join(legacyRoot, rel);
    const dst = path.join(rewriteRoot, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    copied += 1;
  }

  console.log(`Copied ${copied} files from legacy to ${rewriteRoot}`);
}

main();


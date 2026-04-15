/**
 * Garante um clone local do repositório legado GeekLabsSH/hive-tablepro (branch main).
 *
 * Raiz por omissão: <monorepo>/../_reference/hive-tablepro-legacy
 * Sobrescrever: HIVE_TABLEPRO_LEGACY_ROOT=/caminho/absoluto
 *
 * SKIP_GIT=1 — não clonar nem puxar; só verifica se a pasta existe.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");

const defaultRoot = path.join(pkgRoot, "..", "_reference", "hive-tablepro-legacy");
const legacyRoot = process.env.HIVE_TABLEPRO_LEGACY_ROOT || defaultRoot;
const skipGit = process.env.SKIP_GIT === "1";
const repoUrl = "https://github.com/GeekLabsSH/hive-tablepro.git";

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit", encoding: "utf8" });
}

function main() {
  if (fs.existsSync(path.join(legacyRoot, ".git"))) {
    if (!skipGit) {
      console.log("Legacy repo exists, pulling:", legacyRoot);
      run("git fetch origin main && git checkout main && git pull --ff-only origin main", legacyRoot);
    } else {
      console.log("SKIP_GIT=1 — using existing:", legacyRoot);
    }
    console.log("HIVE_TABLEPRO_LEGACY_ROOT=" + legacyRoot);
    return;
  }

  if (skipGit) {
    console.error("SKIP_GIT=1 but legacy clone missing at:", legacyRoot);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(legacyRoot), { recursive: true });
  console.log("Cloning", repoUrl, "→", legacyRoot);
  run(`git clone --depth 1 --branch main "${repoUrl}" "${legacyRoot}"`, path.dirname(legacyRoot));
  console.log("HIVE_TABLEPRO_LEGACY_ROOT=" + legacyRoot);
}

main();

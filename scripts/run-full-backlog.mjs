/**
 * Executa de forma sequencial todo o pipeline automatizável do backlog de paridade:
 * inventário ProtonWeb → clone/pull do legado → matriz legado×v2 → typecheck → check-imports → Vitest.
 *
 * Variáveis opcionais:
 *   SKIP_LEGACY_SYNC=1 — não executa `npm run legacy:sync` (usa clone já existente em HIVE_TABLEPRO_LEGACY_ROOT).
 *   SKIP_LEGACY_MATRIX=1 — não regera a matriz (mantém JSON/fragmento atuais).
 *   RUN_E2E=1 — no fim corre também `npm run test:e2e:storybook` (mais lento).
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");

function run(title, cmd) {
  console.log(`\n${"=".repeat(72)}\n  ${title}\n${"=".repeat(72)}\n`);
  execSync(cmd, { cwd: pkgRoot, stdio: "inherit", shell: true, env: process.env });
}

console.log("\n@geeklabssh/hive-tablepro — pipeline completo do backlog (artefactos + gates)\n");

run("1/6 — Inventário ProtonWeb → scripts/data/protonweb-inventory.json", "npm run inventory:protonweb");

if (process.env.SKIP_LEGACY_SYNC !== "1") {
  run("2/6 — Sync repositório legado (GeekLabsSH/hive-tablepro)", "npm run legacy:sync");
} else {
  console.log("\n[SKIP_LEGACY_SYNC=1] A saltar clone/pull — usar clone em HIVE_TABLEPRO_LEGACY_ROOT\n");
}

if (process.env.SKIP_LEGACY_MATRIX !== "1") {
  run(
    "3/6 — Matriz legado × v2 × ProtonWeb (docs/_generated + secção em LEGACY_REPO_FILE_PARITY_BACKLOG.md)",
    "npm run backlog:legacy-matrix"
  );
} else {
  console.log("\n[SKIP_LEGACY_MATRIX=1] A saltar geração da matriz\n");
}

run("4/6 — Typecheck (tsc --noEmit)", "npm run typecheck");
run("5/6 — check-imports", "npm run check-imports");
run("6/6 — Testes Vitest", "npm test");

if (process.env.RUN_E2E === "1") {
  run("Extra — Playwright Storybook", "npm run test:e2e:storybook");
}

console.log(
  `\n${"=".repeat(72)}\n  Concluído: inventário, matriz (se não saltada), typecheck, imports, testes.\n  Paridade funcional completa (2017 ficheiros + ProtonWeb) continua a ser trabalho iterativo — ver docs/LEGACY_REPO_FILE_PARITY_BACKLOG.md\n${"=".repeat(72)}\n`
);

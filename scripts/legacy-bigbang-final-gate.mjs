import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");

function run(title, cmd) {
  console.log(`\n${"=".repeat(72)}\n  ${title}\n${"=".repeat(72)}\n`);
  execSync(cmd, { cwd: pkgRoot, stdio: "inherit", shell: true, env: process.env });
}

run("1/6 — Scan zero (inventário e hash 1:1)", "npm run legacy:scan-zero");
run("2/6 — Reescrita massiva literal 1:1", "npm run legacy:rewrite-all");
run("3/6 — Scan zero pós-rewrite", "npm run legacy:scan-zero");
run("4/6 — Verificação de contratos (exports)", "npm run legacy:contract-check");
run("5/6 — Relatório 2017/2017", "npm run legacy:report");
run("6/6 — Gate full pipeline (incl. E2E)", "npm run backlog:execute:all");

console.log("\nBig-Bang 1:1 concluído.\n");


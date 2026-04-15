/**
 * Gera matriz de paridade: ficheiros do repo legado GeekLabsSH/hive-tablepro
 * × exports × uso ProtonWeb × sobreposição com hive-tablepro-src (v2).
 *
 * Uso:
 *   npm run legacy:sync
 *   npm run backlog:legacy-matrix
 *
 * Variáveis:
 *   HIVE_TABLEPRO_LEGACY_ROOT — clone do legado (ver ensure-legacy-hive-tablepro.mjs)
 *   SKIP_LEGACY_CLONE=1 — não executar legacy:sync automaticamente
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  collectExportsFromDir,
  extractExportedSymbols,
  flatExportNameSet
} from "./extract-ts-exports.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");

const defaultLegacyRoot = path.join(pkgRoot, "..", "_reference", "hive-tablepro-legacy");
const legacyRoot = process.env.HIVE_TABLEPRO_LEGACY_ROOT || defaultLegacyRoot;

const inventoryPath = path.join(pkgRoot, "scripts", "data", "protonweb-inventory.json");
const outDir = path.join(pkgRoot, "docs", "_generated");
const jsonOut = path.join(outDir, "legacy-matrix.json");
const mdFragmentOut = path.join(outDir, "legacy-matrix.fragment.md");

/** @param {string} rel */
function legacyCategory(rel) {
  const p = rel.replace(/\\/g, "/");
  if (p.startsWith("models/")) return "C";
  if (p.startsWith("scripts/")) return "D";
  if (p.startsWith("utils/")) return "A";
  if (p.startsWith("core/")) return "B";
  return "B";
}

/**
 * @param {string} category
 * @param {string[]} matchedSymbols
 * @param {Set<string>} v2Set
 */
function substituidoHeuristic(category, matchedSymbols, v2Set) {
  if (category === "B") return "comportamental_ou_n_a";
  if (category === "D") return "tooling_pendente_mapear";
  const concrete = matchedSymbols.filter((s) => v2Set.has(s));
  if (matchedSymbols.length === 0) {
    if (category === "C") return "pendente";
    return "pendente";
  }
  if (concrete.length === matchedSymbols.length) return "sim_barrel_ou_overlap";
  if (concrete.length > 0) return "parcial";
  return "pendente";
}

function gitLsFiles(root) {
  if (!fs.existsSync(path.join(root, ".git"))) return [];
  const out = execSync("git ls-files", { cwd: root, encoding: "utf8" });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => /\.(tsx?|jsx?)$/.test(f));
}

function maybeSyncLegacy() {
  if (process.env.SKIP_LEGACY_CLONE === "1") return;
  const ensure = path.join(__dirname, "ensure-legacy-hive-tablepro.mjs");
  try {
    execSync(`node "${ensure}"`, { stdio: "inherit", cwd: pkgRoot });
  } catch {
    console.warn("ensure-legacy-hive-tablepro failed — continuar se já existir lista em cache");
  }
}

function main() {
  maybeSyncLegacy();

  const legacyFiles = gitLsFiles(legacyRoot);
  const legacyRepoAvailable = fs.existsSync(path.join(legacyRoot, ".git"));

  let symbolsImported = {};
  if (fs.existsSync(inventoryPath)) {
    const inv = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
    symbolsImported = inv.symbolsImported || {};
  }

  const v2Ignore = (rel) =>
    rel.includes("/node_modules/") ||
    rel.endsWith(".d.ts") ||
    rel.includes("/playground/") ||
    rel.includes("/stories/");

  const v2Src = collectExportsFromDir(path.join(pkgRoot, "src"), { ignore: v2Ignore });
  const v2CoreX = collectExportsFromDir(path.join(pkgRoot, "core", "x-data-grid", "src"), {
    ignore: v2Ignore
  });
  const v2Pro = collectExportsFromDir(path.join(pkgRoot, "core", "x-data-grid-pro", "src"), {
    ignore: v2Ignore
  });
  const v2Prem = collectExportsFromDir(path.join(pkgRoot, "core", "x-data-grid-premium", "src"), {
    ignore: v2Ignore
  });
  const v2Mui = collectExportsFromDir(path.join(pkgRoot, "core", "mui-material", "src"), {
    ignore: v2Ignore
  });

  /** @type {Map<string, string[]>} */
  const v2Combined = new Map();
  for (const m of [v2Src, v2CoreX, v2Pro, v2Prem, v2Mui]) {
    for (const [k, v] of m) {
      v2Combined.set(k, v);
    }
  }
  const v2Set = flatExportNameSet(v2Combined);

  function v2LocationsForSymbol(sym) {
    const locs = [];
    for (const [rel, syms] of v2Combined) {
      if (syms.includes(sym)) locs.push(rel);
    }
    return locs;
  }

  /** @type {object[]} */
  const rows = [];

  if (!legacyRepoAvailable) {
    console.warn("Legacy repo not found at:", legacyRoot);
    console.warn("Set HIVE_TABLEPRO_LEGACY_ROOT or run: npm run legacy:sync");
  }

  for (const rel of legacyFiles) {
    const abs = path.join(legacyRoot, rel);
    if (!fs.existsSync(abs)) continue;
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const exports = extractExportedSymbols(abs, text);
    const category = legacyCategory(rel);
    const matchedSymbols = exports.filter((e) => !e.startsWith("*") && symbolsImported[e]);
    let protonwebWeight = 0;
    for (const s of matchedSymbols) protonwebWeight += symbolsImported[s] || 0;

    const subst = substituidoHeuristic(
      category,
      exports.filter((e) => !e.startsWith("*")),
      v2Set
    );

    const sampleLocs = [];
    for (const s of matchedSymbols.slice(0, 5)) {
      const locs = v2LocationsForSymbol(s);
      if (locs.length) sampleLocs.push(`${s}→${locs[0]}`);
    }

    rows.push({
      legacy_path: rel.split(path.sep).join("/"),
      category,
      exportCount: exports.length,
      exportsSample: exports.filter((e) => !e.startsWith("*")).slice(0, 12),
      protonwebSymbolHits: protonwebWeight,
      protonwebMatchedSymbols: matchedSymbols,
      substituido: subst,
      v2_hint: sampleLocs.length ? sampleLocs.join("; ") : "—"
    });
  }

  rows.sort((a, b) => b.protonwebSymbolHits - a.protonwebSymbolHits || a.legacy_path.localeCompare(b.legacy_path));

  const payload = {
    generatedAt: new Date().toISOString(),
    legacyRoot,
    legacyRepoAvailable,
    legacyFileCount: rows.length,
    protonwebInventory: fs.existsSync(inventoryPath) ? inventoryPath : null,
    v2ExportSymbolCount: v2Set.size,
    rows
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(jsonOut, JSON.stringify(payload, null, 2), "utf8");
  console.log("Wrote", jsonOut);

  const lines = [];
  lines.push("<!-- Gerado por: npm run backlog:legacy-matrix — não editar -->");
  lines.push("");
  lines.push(`_Última geração: ${payload.generatedAt} · ficheiros legados: ${rows.length} · repo: \`${legacyRoot}\` · disponível: ${legacyRepoAvailable}_`);
  lines.push("");
  lines.push("| legacy_path | cat | substituído | hits PW | exports (amostra) | pista v2 |");
  lines.push("| --- | --- | --- | ---: | --- | --- |");
  for (const r of rows) {
    const ex = r.exportsSample.join(", ").replace(/\|/g, "\\|");
    const hint = String(r.v2_hint).replace(/\|/g, "\\|");
    lines.push(
      `| \`${r.legacy_path}\` | ${r.category} | ${r.substituido} | ${r.protonwebSymbolHits} | ${ex || "—"} | ${hint} |`
    );
  }
  lines.push("");

  fs.writeFileSync(mdFragmentOut, lines.join("\n"), "utf8");
  console.log("Wrote", mdFragmentOut);

  const backlogPath = path.join(pkgRoot, "docs", "LEGACY_REPO_FILE_PARITY_BACKLOG.md");
  const topN = 40;
  const summaryLines = [];
  summaryLines.push("<!-- Gerado por: npm run backlog:legacy-matrix — não editar -->");
  summaryLines.push("");
  summaryLines.push(
    `_Resumo: ${rows.length} ficheiros no legado · geração ${payload.generatedAt} · [tabela completa (todos os ficheiros)](./_generated/legacy-matrix.fragment.md) · JSON: [\`legacy-matrix.json\`](./_generated/legacy-matrix.json)_`
  );
  summaryLines.push("");
  summaryLines.push(`### Top ${topN} ficheiros legado por peso de símbolos importados no ProtonWeb`);
  summaryLines.push("");
  summaryLines.push("| legacy_path | cat | substituído | hits PW | exports (amostra) | pista v2 |");
  summaryLines.push("| --- | --- | --- | ---: | --- | --- |");
  for (const r of rows.slice(0, topN)) {
    const ex = r.exportsSample.join(", ").replace(/\|/g, "\\|");
    const hint = String(r.v2_hint).replace(/\|/g, "\\|");
    summaryLines.push(
      `| \`${r.legacy_path}\` | ${r.category} | ${r.substituido} | ${r.protonwebSymbolHits} | ${ex || "—"} | ${hint} |`
    );
  }
  summaryLines.push("");

  if (fs.existsSync(backlogPath)) {
    const full = fs.readFileSync(backlogPath, "utf8");
    const start = "<!-- LEGACY_MATRIX_BEGIN -->";
    const end = "<!-- LEGACY_MATRIX_END -->";
    if (full.includes(start) && full.includes(end)) {
      const i0 = full.indexOf(start);
      const i1 = full.indexOf(end);
      const next =
        full.slice(0, i0 + start.length) +
        "\n\n" +
        summaryLines.join("\n") +
        "\n\n" +
        full.slice(i1);
      fs.writeFileSync(backlogPath, next, "utf8");
      console.log("Updated matrix summary in", backlogPath);
    } else {
      console.log("Backlog exists but markers missing — só fragmento em docs/_generated/");
    }
  }
}

main();

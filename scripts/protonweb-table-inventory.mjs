/**
 * Inventário de uso de @geeklabssh/hive-tablepro no ProtonWeb.
 * Uso: node scripts/protonweb-table-inventory.mjs
 * Opcional: PROTONWEB_SRC=C:\...\ProtonWeb\src
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, "..");

const defaultProtonSrc = path.join(
  pkgRoot,
  "..",
  "protonerp",
  "src",
  "front-end",
  "ProtonWeb",
  "src"
);
const protonSrc = process.env.PROTONWEB_SRC || defaultProtonSrc;

const PATTERNS = [
  ["getActions", /\bgetActions\s*:/g],
  ['type: "actions"', /type:\s*["']actions["']/g],
  ["editMode", /\beditMode\s*=/g],
  ["processRowUpdate", /\bprocessRowUpdate\s*=/g],
  ["rowModesModel", /\browModesModel\b/g],
  ["checkboxSelection", /\bcheckboxSelection\b/g],
  ["rowSelectionModel", /\browSelectionModel\b/g],
  ["slots:", /\bslots\s*=\s*\{/g],
  ["components:", /\bcomponents\s*=\s*\{/g],
  ["GridToolbar", /\bGridToolbar\w*\b/g],
  ["useGridRootProps", /\buseGridRootProps\b/g],
  ["useGridApiRef", /\buseGridApiRef\b/g],
  ["apiRef", /\bapiRef\b/g],
  ["valueGetter", /\bvalueGetter\s*:/g],
  ["valueFormatter", /\bvalueFormatter\s*:/g],
  ["singleSelect", /type:\s*["']singleSelect["']/g],
  ["renderCell", /\brenderCell\s*:/g],
  ["renderEditCell", /\brenderEditCell\s*:/g],
  ["pinnedColumns", /\bpinnedColumns\b/g],
  ["sortModel", /\bsortModel\b/g],
  ["filterModel", /\bfilterModel\b/g],
  ["paginationMode", /\bpaginationMode\b/g],
  ["getRowClassName", /\bgetRowClassName\b/g],
  ["isCellEditable", /\bisCellEditable\b/g],
  ["rowModeEntryIsEdit", /\browModeEntryIsEdit\b/g],
  ["StyledDataGridPro", /\bStyledDataGridPro\b/g],
  ["@geeklabssh/hive-tablepro/table", /from\s+["']@geeklabssh\/hive-tablepro\/table["']/g]
];

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walkFiles(p, acc);
    } else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const importRe =
  /import\s+(?:type\s+)?(?:\{([^}]+)\}|(\*\s+as\s+\w+)|(\w+))\s+from\s+["']@geeklabssh\/hive-tablepro["']/gs;

function parseNamedImports(block) {
  const names = new Set();
  const parts = block.split(",");
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    const asMatch = p.match(/^(\w+)\s+as\s+(\w+)$/);
    if (asMatch) {
      names.add(asMatch[2]);
      continue;
    }
    if (/^type\s+/i.test(p)) p = p.replace(/^type\s+/i, "").trim();
    const m = p.match(/^(\w+)$/);
    if (m) names.add(m[1]);
  }
  return names;
}

function main() {
  const files = walkFiles(protonSrc);
  const importFiles = [];
  const symbolCount = new Map();
  const patternHits = Object.fromEntries(PATTERNS.map(([k]) => [k, { files: 0, matches: 0 }]));

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (!text.includes("@geeklabssh/hive-tablepro")) continue;
    importFiles.push(file);

    let m;
    const re = new RegExp(importRe.source, importRe.flags);
    while ((m = re.exec(text)) !== null) {
      if (m[1]) {
        for (const n of parseNamedImports(m[1])) {
          symbolCount.set(n, (symbolCount.get(n) || 0) + 1);
        }
      }
    }

    for (const [label, regex] of PATTERNS) {
      const ms = text.match(regex);
      if (ms && ms.length) {
        patternHits[label].files += 1;
        patternHits[label].matches += ms.length;
      }
    }
  }

  const symbols = [...symbolCount.entries()].sort((a, b) => b[1] - a[1]);
  const out = {
    generatedAt: new Date().toISOString(),
    protonSrc,
    protonSrcExists: fs.existsSync(protonSrc),
    filesImportingPackage: importFiles.length,
    importFileSample: importFiles.slice(0, 30),
    symbolsImported: Object.fromEntries(symbols),
    patternHits
  };

  const dataDir = path.join(pkgRoot, "scripts", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const jsonPath = path.join(dataDir, "protonweb-inventory.json");
  fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", jsonPath);
  console.log("Files:", out.filesImportingPackage, "proton exists:", out.protonSrcExists);
}

main();

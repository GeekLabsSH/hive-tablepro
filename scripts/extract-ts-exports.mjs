/**
 * Extrai nomes exportados de ficheiros .ts/.tsx (TypeScript AST).
 * Usado pelo gerador de matriz legado ↔ v2.
 */
import fs from "fs";
import path from "path";
import ts from "typescript";

/**
 * @param {string} filePath
 * @param {string} sourceText
 * @returns {string[]}
 */
export function extractExportedSymbols(filePath, sourceText) {
  const kind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const src = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, kind);
  /** @type {string[]} */
  const names = [];

  function add(n) {
    if (n && !names.includes(n)) names.push(n);
  }

  function visit(node) {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause) {
        if (ts.isNamedExports(node.exportClause)) {
          for (const el of node.exportClause.elements) {
            add(el.name.text);
          }
        } else if (ts.isNamespaceExport(node.exportClause)) {
          add(`* as ${node.exportClause.name.text}`);
        }
      } else if (node.moduleSpecifier) {
        const spec = node.moduleSpecifier.getText(src).replace(/^["']|["']$/g, "");
        add(`* from ${spec}`);
      }
      return;
    }

    if (ts.isExportAssignment(node)) {
      add("default");
      return;
    }

    const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const isExport = mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExport) {
      ts.forEachChild(node, visit);
      return;
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      add(node.name.text);
    } else if (ts.isClassDeclaration(node) && node.name) {
      add(node.name.text);
    } else if (ts.isInterfaceDeclaration(node)) {
      add(node.name.text);
    } else if (ts.isTypeAliasDeclaration(node)) {
      add(node.name.text);
    } else if (ts.isEnumDeclaration(node)) {
      add(node.name.text);
    } else if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) add(d.name.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(src);
  return names;
}

/**
 * Percorre diretório e devolve Map<relPath, string[]>
 * @param {string} rootAbs
 * @param {{ ignore?: (p: string) => boolean }} opts
 */
export function collectExportsFromDir(rootAbs, opts = {}) {
  const { ignore = () => false } = opts;
  /** @type {Map<string, string[]>} */
  const map = new Map();

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      const rel = path.relative(rootAbs, p).split(path.sep).join("/");
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".git") continue;
        walk(p);
        continue;
      }
      if (!/\.tsx?$/.test(ent.name)) continue;
      if (/\.test\.tsx?$|\.stories\.tsx?$/.test(ent.name)) continue;
      if (ignore(rel)) continue;
      try {
        const text = fs.readFileSync(p, "utf8");
        const syms = extractExportedSymbols(p, text);
        if (syms.length) map.set(rel, syms);
      } catch {
        /* */
      }
    }
  }

  walk(rootAbs);
  return map;
}

/**
 * União de todos os símbolos exportados (strings literais, sem `* from`).
 * @param {Map<string, string[]>} dirMap
 */
export function flatExportNameSet(dirMap) {
  const s = new Set();
  for (const arr of dirMap.values()) {
    for (const n of arr) {
      if (!n.startsWith("*")) s.add(n);
    }
  }
  return s;
}

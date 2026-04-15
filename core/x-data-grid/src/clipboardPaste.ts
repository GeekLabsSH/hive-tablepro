import { colHasValueOptions, resolveColValueOptions } from "./adapter";
import type {
  GridCellParams,
  GridColDef,
  GridRowId,
  GridRowUpdate,
  GridValidRowModel,
  GridValueOptionsList
} from "./types";

/** Divide texto TSV (Excel, Sheets) em matriz de células. */
export function parseClipboardTsv(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  if (lines.length === 0) return [];
  return lines.map((line) => line.split("\t"));
}

type SelectOptNorm = { value: string; label: string; raw: string | number };

function normalizeSelectOptions(options: GridValueOptionsList): SelectOptNorm[] {
  return options.map((o) => {
    if (o !== null && typeof o === "object" && "value" in o) {
      const x = o as { value: string | number; label: string };
      return { value: String(x.value), label: x.label, raw: x.value };
    }
    return { value: String(o), label: String(o), raw: o as string | number };
  });
}

/** Alinhado a `cellEditorSupported` na DataGrid — colunas onde colar texto faz sentido. */
function pasteEditorSupported<R extends GridValidRowModel>(col: GridColDef<R>): boolean {
  if (col.renderEditCell) return true;
  if (col.type === "singleSelect") return colHasValueOptions(col);
  if (col.type === "boolean") return true;
  if (col.type === "string" || col.type === "number") return true;
  if (col.type === undefined) return true;
  return false;
}

/** Converte texto colado para o tipo da coluna (paridade com edição nativa). */
export function coercePasteTextForColumn<R extends GridValidRowModel>(
  col: GridColDef<R> | undefined,
  raw: string,
  rowContext?: { id: GridRowId; row: R }
): unknown {
  if (!col) return raw;
  const t = raw.trim();
  if (col.type === "number") {
    if (t === "") return "";
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : raw;
  }
  if (col.type === "boolean") {
    const lower = t.toLowerCase();
    if (["true", "1", "yes", "sim", "y"].includes(lower)) return true;
    if (["false", "0", "no", "não", "nao", "n"].includes(lower)) return false;
    return raw;
  }
  if (col.type === "singleSelect") {
    const list = rowContext
      ? resolveColValueOptions(col, rowContext.id, rowContext.row)
      : typeof col.valueOptions === "function"
        ? undefined
        : col.valueOptions;
    if (!list?.length) return raw;
    const opts = normalizeSelectOptions(list);
    const byValue = opts.find((o) => o.value === t || String(o.raw) === t);
    if (byValue) return byValue.raw;
    const byLabel = opts.find((o) => o.label.trim().toLowerCase() === t.toLowerCase());
    if (byLabel) return byLabel.raw;
    return raw;
  }
  return raw;
}

export type ClipboardPastePlan<R extends GridValidRowModel> = {
  /** Atualizações por linha (uma entrada por `id`). */
  updates: GridRowUpdate<R>[];
};

/**
 * A partir da célula inicial (índice de linha de dados, índice de coluna visível) e TSV,
 * constrói atualizações para `onRowsChange` / `processRowUpdate`.
 */
export function buildClipboardPastePlan<R extends GridValidRowModel>(opts: {
  matrix: string[][];
  tableRows: { id: string; getIsGrouped: () => boolean; original: R }[];
  visibleFields: string[];
  columnsByField: Map<string, GridColDef<R>>;
  startRowIndex: number;
  startColIndex: number;
  getRowId: (row: R) => GridRowId;
}): ClipboardPastePlan<R> | null {
  const { matrix, tableRows, visibleFields, columnsByField, startRowIndex, startColIndex } = opts;
  if (matrix.length === 0 || visibleFields.length === 0) return null;

  type Cell = { rowIndex: number; field: string; value: unknown };
  const cells: Cell[] = [];

  for (let r = 0; r < matrix.length; r++) {
    const rowVals = matrix[r] ?? [];
    for (let c = 0; c < rowVals.length; c++) {
      const tr = startRowIndex + r;
      const tc = startColIndex + c;
      if (tr < 0 || tr >= tableRows.length) continue;
      const trow = tableRows[tr];
      if (!trow || trow.getIsGrouped()) continue;
      if (tc < 0 || tc >= visibleFields.length) continue;
      const field = visibleFields[tc];
      if (
        field === "__select__" ||
        field === "__detail__" ||
        field === "__tree__" ||
        field.startsWith("__aggregation")
      ) {
        continue;
      }
      const col = columnsByField.get(field);
      if (!col || col.editable !== true || !pasteEditorSupported(col)) continue;
      const row = trow.original;
      const cellParams: GridCellParams<R> = {
        id: opts.getRowId(row),
        field,
        row,
        value: (row as Record<string, unknown>)[field]
      };
      if (col.isCellEditable && !col.isCellEditable(cellParams)) continue;

      const pasted = rowVals[c] ?? "";
      const value = coercePasteTextForColumn(col, pasted, {
        id: opts.getRowId(row),
        row
      });
      cells.push({ rowIndex: tr, field, value });
    }
  }

  if (cells.length === 0) return null;

  const byId = new Map<GridRowId, GridRowUpdate<R>>();
  for (const { field, value, rowIndex } of cells) {
    const row = tableRows[rowIndex]!.original;
    const id = opts.getRowId(row);
    let u = byId.get(id);
    if (!u) {
      u = { id } as GridRowUpdate<R>;
      byId.set(id, u);
    }
    (u as Record<string, unknown>)[field] = value;
  }

  return { updates: [...byId.values()] };
}

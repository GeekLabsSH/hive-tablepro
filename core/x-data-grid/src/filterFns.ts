import type { Cell, FilterFn, Row } from "@tanstack/react-table";
import type {
  GridApiCommunity,
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperator,
  GridValidRowModel
} from "./types";

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && v instanceof Date) return v.toISOString();
  return String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function toTime(v: unknown): number {
  if (v instanceof Date) return v.getTime();
  const s = str(v).trim();
  // `YYYY-MM-DD` (input `type="date"` / só dia): meio-dia local evita desvios de fuso vs células `Date` à meia-noite.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const noon = Date.parse(`${s}T12:00:00`);
    return Number.isFinite(noon) ? noon : NaN;
  }
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : NaN;
}

/** Avalia um operador MUI contra um valor de célula (reutilizado por filtro global e por coluna). */
export function applyGridFilterOperator(
  cell: unknown,
  operator: GridFilterOperator,
  value: unknown
): boolean {
  const cs = str(cell);
  const vs = str(value);
  const cellT = toTime(cell);
  const valT = toTime(value);

  switch (operator) {
    case "contains":
      return cs.toLowerCase().includes(vs.toLowerCase());
    case "equals":
      return cs === vs;
    case "startsWith":
      return cs.toLowerCase().startsWith(vs.toLowerCase());
    case "endsWith":
      return cs.toLowerCase().endsWith(vs.toLowerCase());
    case "isEmpty":
      return cs === "";
    case "isNotEmpty":
      return cs !== "";
    case "=":
      return num(cell) === num(value);
    case "!=":
      return num(cell) !== num(value);
    case ">":
      return num(cell) > num(value);
    case ">=":
      return num(cell) >= num(value);
    case "<":
      return num(cell) < num(value);
    case "<=":
      return num(cell) <= num(value);
    case "is":
      return Number.isFinite(cellT) && Number.isFinite(valT) ? cellT === valT : cs === vs;
    case "not":
      return Number.isFinite(cellT) && Number.isFinite(valT) ? cellT !== valT : cs !== vs;
    case "after":
      return Number.isFinite(cellT) && Number.isFinite(valT) && cellT > valT;
    case "onOrAfter":
      return Number.isFinite(cellT) && Number.isFinite(valT) && cellT >= valT;
    case "before":
      return Number.isFinite(cellT) && Number.isFinite(valT) && cellT < valT;
    case "onOrBefore":
      return Number.isFinite(cellT) && Number.isFinite(valT) && cellT <= valT;
    default:
      return true;
  }
}

/** Uma linha satisfaz um único `GridFilterItem` (campo + operador). */
export function rowMatchesFilterItem<R extends GridValidRowModel>(
  row: Row<R>,
  item: GridFilterItem
): boolean {
  const cell = row.getValue(item.field);
  return applyGridFilterOperator(cell, item.operator, item.value);
}

/**
 * Combina `filterModel.items` com `logicOperator` (And = todos, Or = qualquer).
 * Quick filter não entra aqui — trata-se à parte.
 */
export function rowPassesFilterModel<R extends GridValidRowModel>(
  row: Row<R>,
  model: GridFilterModel
): boolean {
  const items = model.items ?? [];
  if (items.length === 0) return true;
  const logic = model.logicOperator ?? "And";
  const preds = items.map((it) => rowMatchesFilterItem(row, it));
  return logic === "Or" ? preds.some(Boolean) : preds.every(Boolean);
}

/** Filtro por coluna com operadores estilo MUI X */
export const muiColumnFilterFn: FilterFn<GridValidRowModel> = (
  row: Row<GridValidRowModel>,
  columnId: string,
  filterValue: unknown
) => {
  if (filterValue == null || typeof filterValue !== "object") return true;
  const { operator, value } = filterValue as { operator: GridFilterOperator; value: unknown };
  const cell = row.getValue(columnId);
  return applyGridFilterOperator(cell, operator, value);
};

export type HiveGlobalFilterBag<R extends GridValidRowModel> = {
  __hive: true;
  quickTyped: string;
  filterModel: GridFilterModel;
  disableQuick: boolean;
  getApi?: () => GridApiCommunity<R> | null;
  columnsByField?: Map<string, GridColDef<R>>;
};

function cellMatchesQuickToken<R extends GridValidRowModel>(
  cell: Cell<R, unknown>,
  filterValue: string,
  bag: HiveGlobalFilterBag<R>
): boolean {
  const id = String(cell.column.id);
  if (id === "__select__" || id === "__detail__" || id === "__tree__") return false;
  const colDef = bag.columnsByField?.get(id);
  const api = bag.getApi?.() ?? null;
  if (colDef?.getApplyQuickFilterFn) {
    const fn = colDef.getApplyQuickFilterFn(filterValue, colDef, api);
    if (fn === null) return false;
    return fn(cell.getValue());
  }
  const needle = filterValue.trim().toLowerCase();
  if (!needle) return false;
  return String(cell.getValue() ?? "")
    .toLowerCase()
    .includes(needle);
}

/** Quick filter: texto livre — qualquer coluna visível contém o texto */
export function rowMatchesQuickSubstring<R extends GridValidRowModel>(
  row: Row<R>,
  q: string,
  bag: HiveGlobalFilterBag<R>
): boolean {
  const needle = q.trim();
  if (!needle) return true;
  return row.getVisibleCells().some((cell) => cellMatchesQuickToken(cell, needle, bag));
}

/** Vários tokens em `quickFilterValues` com And/Or (estilo MUI). */
export function rowMatchesQuickFilterValues<R extends GridValidRowModel>(
  row: Row<R>,
  values: string[],
  logic: "And" | "Or",
  bag: HiveGlobalFilterBag<R>
): boolean {
  if (!values.length) return true;
  const tokens = values.map((v) => String(v).trim()).filter(Boolean);
  if (!tokens.length) return true;
  const checks = tokens.map((token) =>
    row.getVisibleCells().some((cell) => cellMatchesQuickToken(cell, token, bag))
  );
  return logic === "Or" ? checks.some(Boolean) : checks.every(Boolean);
}

/** Avaliação completa do saco global (quick + items do modelo). */
export function rowPassesHiveGlobalFilter<R extends GridValidRowModel>(
  row: Row<R>,
  bag: HiveGlobalFilterBag<R>
): boolean {
  if (!bag.disableQuick) {
    const qLogic = bag.filterModel.quickFilterLogicOperator ?? "And";
    const qVals = bag.filterModel.quickFilterValues?.filter((x) => String(x).trim() !== "") ?? [];
    if (qVals.length > 0) {
      if (!rowMatchesQuickFilterValues(row, qVals.map(String), qLogic, bag)) return false;
    } else if (bag.quickTyped.trim() !== "") {
      if (!rowMatchesQuickSubstring(row, bag.quickTyped, bag)) return false;
    }
  }
  return rowPassesFilterModel(row, bag.filterModel);
}

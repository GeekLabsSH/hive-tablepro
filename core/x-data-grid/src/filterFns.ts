import type { Cell, FilterFn, Row } from "@tanstack/react-table";
import {
  colHasValueOptions,
  formatSingleSelectDisplay,
  resolveColValueOptions
} from "./gridValueOptions";
import type {
  GridApiCommunity,
  GridColDef,
  GridFilterItem,
  GridFilterModel,
  GridFilterOperator,
  GridRowId,
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

function parseInListTokens(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  return String(value)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function asMultiSelectValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  const s = String(value).trim();
  if (!s) return [];
  try {
    const j = JSON.parse(s) as unknown;
    if (Array.isArray(j)) return j;
  } catch {
    /* ignore */
  }
  return parseInListTokens(value).map((x) => x as unknown);
}

function valuesEqualCaseInsensitive(a: unknown, b: unknown): boolean {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
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
    case "!=": {
      const cn = num(cell);
      const vn = num(value);
      if (Number.isFinite(cn) && Number.isFinite(vn)) return cn !== vn;
      return !valuesEqualCaseInsensitive(cell, value);
    }
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
    case "inList": {
      const tokens = parseInListTokens(value);
      if (tokens.length === 0) return true;
      const cn = num(cell);
      if (Number.isFinite(cn)) {
        return tokens.some((t) => {
          const tn = num(t);
          return Number.isFinite(tn) && tn === cn;
        });
      }
      const csl = cs.trim().toLowerCase();
      return tokens.some((t) => t.trim().toLowerCase() === csl);
    }
    case "selectAny": {
      const opts = asMultiSelectValues(value);
      if (opts.length === 0) return true;
      return opts.some((o) => valuesEqualCaseInsensitive(cell, o));
    }
    case "selectAll": {
      const opts = asMultiSelectValues(value);
      if (opts.length === 0) return true;
      if (Array.isArray(cell)) {
        const cells = cell.map((x) => String(x).trim().toLowerCase());
        return opts.every((o) =>
          cells.some((c) => c === String(o ?? "").trim().toLowerCase())
        );
      }
      if (opts.length === 1) return valuesEqualCaseInsensitive(cell, opts[0]);
      return false;
    }
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

function itemHasMeaningfulFilter(it: GridFilterItem): boolean {
  if (it.operator === "isEmpty" || it.operator === "isNotEmpty") return true;
  if (it.operator === "inList" || it.operator === "selectAny" || it.operator === "selectAll") {
    const v = it.value;
    if (Array.isArray(v)) return v.length > 0;
    return String(v ?? "").trim() !== "";
  }
  return it.value !== undefined && it.value !== null && String(it.value).trim() !== "";
}

/**
 * Conta filtros de coluna activos + tokens de `quickFilterValues` + `quickFilterValue` espelhado em modelo.
 */
export function countActiveGridFilters(model: GridFilterModel, quickTyped?: string): number {
  let n = (model.items ?? []).filter(itemHasMeaningfulFilter).length;
  const qv = model.quickFilterValues?.map((x) => String(x).trim()).filter(Boolean) ?? [];
  n += qv.length;
  if (quickTyped != null && quickTyped.trim() !== "" && qv.length === 0) n += 1;
  return n;
}

/**
 * `groupId` fixo para filtros criados pela **linha de filtro do cabeçalho** da grelha.
 * Aparecem no painel «Filtros ativos» sob o bloco **Colunas** (ver `GridFilterPanel`).
 */
export const HIVE_FILTER_HEADER_GROUP_ID = "__hive_columns__" as const;

/** Chave estável do grupo para `groupId` (itens sem grupo → `__flat__`). */
export function gridFilterGroupKey(id: GridFilterItem["groupId"]): string {
  if (id === undefined || id === null) return "__flat__";
  return String(id);
}

export function isHiveFilterHeaderGroupKey(gk: string): boolean {
  return gk === HIVE_FILTER_HEADER_GROUP_ID;
}

/** Ordena cópia dos itens por `filterOrder`, com empate pela ordem original em `items`. */
export function sortFilterItemsByOrder(items: GridFilterItem[]): GridFilterItem[] {
  return items
    .map((it, index) => ({ it, index }))
    .sort((a, b) => {
      const oa = a.it.filterOrder;
      const ob = b.it.filterOrder;
      if (oa != null && ob != null && oa !== ob) return oa - ob;
      if (oa != null && ob == null) return -1;
      if (oa == null && ob != null) return 1;
      return a.index - b.index;
    })
    .map(({ it }) => it);
}

/**
 * Combina `filterModel.items` com `logicOperator` (And = todos, Or = qualquer), ou com grupos
 * (`groupId` + `groupItemLogic` + `groupLogicOperator`) quando pelo menos um item define `groupId`.
 * Quick filter não entra aqui — trata-se à parte.
 */
export function rowPassesFilterModel<R extends GridValidRowModel>(
  row: Row<R>,
  model: GridFilterModel
): boolean {
  const rawItems = model.items ?? [];
  if (rawItems.length === 0) return true;
  const items = sortFilterItemsByOrder(rawItems);

  const useGroups = rawItems.some((it) => it.groupId !== undefined && it.groupId !== null);
  if (!useGroups) {
    const fallback = model.logicOperator ?? "And";
    let acc = rowMatchesFilterItem(row, items[0]!);
    for (let i = 1; i < items.length; i++) {
      const join = items[i]!.joinWithPrevious ?? fallback;
      const next = rowMatchesFilterItem(row, items[i]!);
      acc = join === "Or" ? acc || next : acc && next;
    }
    return acc;
  }

  const seen = new Set<string>();
  const groupOrder: string[] = [];
  for (const it of items) {
    const k = gridFilterGroupKey(it.groupId);
    if (!seen.has(k)) {
      seen.add(k);
      groupOrder.push(k);
    }
  }

  const betweenGroups = model.groupLogicOperator ?? "And";
  const groupResults: boolean[] = [];

  for (const gk of groupOrder) {
    const groupItems = items.filter((it) => gridFilterGroupKey(it.groupId) === gk);
    if (groupItems.length === 0) continue;
    let acc = rowMatchesFilterItem(row, groupItems[0]!);
    for (let i = 1; i < groupItems.length; i++) {
      const join = groupItems[i]!.groupItemLogic ?? "And";
      const next = rowMatchesFilterItem(row, groupItems[i]!);
      acc = join === "Or" ? acc || next : acc && next;
    }
    groupResults.push(acc);
  }

  if (groupResults.length === 0) return true;
  return betweenGroups === "Or" ? groupResults.some(Boolean) : groupResults.every(Boolean);
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
  /**
   * Quando `true`, `filterModel.items` não restringe linhas no cliente (filtros de coluna só via servidor);
   * `quickFilterValues` / texto rápido continuam a filtrar localmente.
   */
  serverDrivenColumnFilters?: boolean;
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

  const raw = cell.getValue();
  const hay: string[] = [];
  const pushNorm = (v: unknown) => {
    const s = v == null ? "" : String(v).trim();
    if (s.length > 0) hay.push(s.toLowerCase());
  };
  pushNorm(raw);

  if (colDef?.valueFormatter) {
    try {
      pushNorm(
        colDef.valueFormatter({
          id: cell.row.id as GridRowId,
          field: id,
          row: cell.row.original,
          value: raw as never
        })
      );
    } catch {
      /* evitar quebrar a pesquisa rápida se o formatador lançar */
    }
  }

  const selectLike =
    colDef != null &&
    colDef.type !== "boolean" &&
    colDef.type !== "actions" &&
    (colDef.type === "singleSelect" ||
      colDef.async === true ||
      (colHasValueOptions(colDef) && colDef.type !== "date" && colDef.type !== "dateTime"));

  if (selectLike) {
    const opts = resolveColValueOptions(colDef, cell.row.id as GridRowId, cell.row.original);
    pushNorm(formatSingleSelectDisplay(raw, opts));
  }

  return hay.some((h) => h.includes(needle));
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
  if (bag.serverDrivenColumnFilters) {
    return rowPassesFilterModel(row, { ...bag.filterModel, items: [] });
  }
  return rowPassesFilterModel(row, bag.filterModel);
}

function getDataCellRaw<R extends GridValidRowModel>(
  data: R,
  field: string,
  colDef: GridColDef<R> | undefined,
  rowId: GridRowId
): unknown {
  const raw0 = (data as Record<string, unknown>)[field];
  if (!colDef?.valueGetter) return raw0;
  try {
    return colDef.valueGetter({
      field,
      id: rowId,
      row: data,
      value: raw0
    } as never);
  } catch {
    return raw0;
  }
}

function dataValueMatchesQuickToken<R extends GridValidRowModel>(
  id: string,
  raw: unknown,
  data: R,
  rowId: GridRowId,
  filterValue: string,
  bag: HiveGlobalFilterBag<R>
): boolean {
  if (id === "__select__" || id === "__detail__" || id === "__tree__") return false;
  const colDef = bag.columnsByField?.get(id);
  const api = bag.getApi?.() ?? null;
  if (colDef?.getApplyQuickFilterFn) {
    const fn = colDef.getApplyQuickFilterFn(filterValue, colDef, api);
    if (fn === null) return false;
    return fn(raw);
  }
  const needle = filterValue.trim().toLowerCase();
  if (!needle) return false;
  const hay: string[] = [];
  const pushNorm = (v: unknown) => {
    const s = v == null ? "" : String(v).trim();
    if (s.length > 0) hay.push(s.toLowerCase());
  };
  pushNorm(raw);
  if (colDef?.valueFormatter) {
    try {
      pushNorm(
        colDef.valueFormatter({
          id: rowId,
          field: id,
          row: data,
          value: raw as never
        })
      );
    } catch {
      /* ignore */
    }
  }
  const selectLike =
    colDef != null &&
    colDef.type !== "boolean" &&
    colDef.type !== "actions" &&
    (colDef.type === "singleSelect" ||
      colDef.async === true ||
      (colHasValueOptions(colDef) && colDef.type !== "date" && colDef.type !== "dateTime"));
  if (selectLike) {
    const opts = resolveColValueOptions(colDef, rowId, data);
    pushNorm(formatSingleSelectDisplay(raw, opts));
  }
  return hay.some((h) => h.includes(needle));
}

function dataMatchesQuickSubstring<R extends GridValidRowModel>(
  data: R,
  q: string,
  bag: HiveGlobalFilterBag<R>,
  rowId: GridRowId
): boolean {
  const needle = q.trim();
  if (!needle) return true;
  const cols = bag.columnsByField;
  if (!cols?.size) return true;
  for (const [id, colDef] of cols) {
    const raw = getDataCellRaw(data, id, colDef, rowId);
    if (dataValueMatchesQuickToken(id, raw, data, rowId, needle, bag)) return true;
  }
  return false;
}

function dataMatchesQuickFilterValues<R extends GridValidRowModel>(
  data: R,
  values: string[],
  logic: "And" | "Or",
  bag: HiveGlobalFilterBag<R>,
  rowId: GridRowId
): boolean {
  if (!values.length) return true;
  const tokens = values.map((v) => String(v).trim()).filter(Boolean);
  if (!tokens.length) return true;
  const checks = tokens.map((token) => dataMatchesQuickSubstring(data, token, bag, rowId));
  return logic === "Or" ? checks.some(Boolean) : checks.every(Boolean);
}

function dataMatchesFilterItem<R extends GridValidRowModel>(
  data: R,
  item: GridFilterItem,
  bag: HiveGlobalFilterBag<R>,
  rowId: GridRowId
): boolean {
  const col = bag.columnsByField?.get(item.field);
  const cell = getDataCellRaw(data, item.field, col, rowId);
  return applyGridFilterOperator(cell, item.operator, item.value);
}

function dataPassesFilterModel<R extends GridValidRowModel>(
  data: R,
  model: GridFilterModel,
  bag: HiveGlobalFilterBag<R>,
  rowId: GridRowId
): boolean {
  const rawItems = model.items ?? [];
  if (rawItems.length === 0) return true;
  const items = sortFilterItemsByOrder(rawItems);

  const useGroups = rawItems.some((it) => it.groupId !== undefined && it.groupId !== null);
  if (!useGroups) {
    const fallback = model.logicOperator ?? "And";
    let acc = dataMatchesFilterItem(data, items[0]!, bag, rowId);
    for (let i = 1; i < items.length; i++) {
      const join = items[i]!.joinWithPrevious ?? fallback;
      const next = dataMatchesFilterItem(data, items[i]!, bag, rowId);
      acc = join === "Or" ? acc || next : acc && next;
    }
    return acc;
  }

  const seen = new Set<string>();
  const groupOrder: string[] = [];
  for (const it of items) {
    const k = gridFilterGroupKey(it.groupId);
    if (!seen.has(k)) {
      seen.add(k);
      groupOrder.push(k);
    }
  }

  const betweenGroups = model.groupLogicOperator ?? "And";
  const groupResults: boolean[] = [];

  for (const gk of groupOrder) {
    const groupItems = items.filter((it) => gridFilterGroupKey(it.groupId) === gk);
    if (groupItems.length === 0) continue;
    let acc = dataMatchesFilterItem(data, groupItems[0]!, bag, rowId);
    for (let i = 1; i < groupItems.length; i++) {
      const join = groupItems[i]!.groupItemLogic ?? "And";
      const next = dataMatchesFilterItem(data, groupItems[i]!, bag, rowId);
      acc = join === "Or" ? acc || next : acc && next;
    }
    groupResults.push(acc);
  }

  if (groupResults.length === 0) return true;
  return betweenGroups === "Or" ? groupResults.some(Boolean) : groupResults.every(Boolean);
}

/**
 * Mesma regra que `rowPassesHiveGlobalFilter` para linhas TanStack, aplicada ao objecto de dados `R`
 * (ex.: agregar pivot/gráficos sobre todas as linhas filtradas sem paginação).
 */
export function dataPassesHiveGlobalFilter<R extends GridValidRowModel>(
  data: R,
  bag: HiveGlobalFilterBag<R>,
  rowId: GridRowId
): boolean {
  if (!bag.disableQuick) {
    const qLogic = bag.filterModel.quickFilterLogicOperator ?? "And";
    const qVals = bag.filterModel.quickFilterValues?.filter((x) => String(x).trim() !== "") ?? [];
    if (qVals.length > 0) {
      if (!dataMatchesQuickFilterValues(data, qVals.map(String), qLogic, bag, rowId)) return false;
    } else if (bag.quickTyped.trim() !== "") {
      if (!dataMatchesQuickSubstring(data, bag.quickTyped, bag, rowId)) return false;
    }
  }
  if (bag.serverDrivenColumnFilters) {
    return dataPassesFilterModel(data, { ...bag.filterModel, items: [] }, bag, rowId);
  }
  return dataPassesFilterModel(data, bag.filterModel, bag, rowId);
}

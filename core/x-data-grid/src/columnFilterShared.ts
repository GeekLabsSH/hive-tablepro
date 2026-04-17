import type {
  GridColDef,
  GridFilterItem,
  GridFilterOperator,
  GridLocaleText,
  GridRowId,
  GridValidRowModel,
  GridValueOptionsList
} from "./types";
import { colHasValueOptions, colHasFilterableSingleSelect } from "./adapter";

export type FilterOpChoice = { value: GridFilterOperator; label: string };

export type NormOpt = { value: string; label: string; raw: string | number };

function rawMatchesNormOpt(raw: unknown, opt: NormOpt): boolean {
  return Object.is(raw, opt.raw) || String(raw) === String(opt.raw);
}

/**
 * Chaves `normOpts.value` correspondentes ao valor guardado no filtro (um raw ou array de raws).
 */
/** Chaves string para multiselect a partir do valor persistido (sem depender de `normOpts`). */
export function rawKeysFromFilterMultiValue(filterValue: unknown): string[] {
  if (filterValue === undefined || filterValue === null) return [];
  if (filterValue === "") return [];
  if (typeof filterValue === "boolean") return [];
  if (Array.isArray(filterValue)) {
    const mapped = filterValue
      .filter((x) => x !== undefined && x !== null && x !== "")
      .map((x) => String(x));
    /** Um único `0` costuma ser ruído ao mudar de «Igual a» para «Seleção» sem escolha real. */
    if (mapped.length === 1 && mapped[0] === "0") return [];
    return mapped;
  }
  const s = String(filterValue);
  if (s === "0" && (filterValue === 0 || filterValue === "0")) return [];
  return [s];
}

/**
 * Valores brutos (ids/chaves) num item de filtro `singleSelect` assíncrono, para pré-carregar rótulos no painel.
 */
export function collectRemoteSingleSelectRawKeysFromFilterItem(item: GridFilterItem): string[] {
  const { operator, value } = item;
  if (value === undefined || value === null || value === "") return [];
  if (operator === "selectAny" || operator === "selectAll") {
    return rawKeysFromFilterMultiValue(value);
  }
  if (operator === "equals" || operator === "!=" || operator === "is" || operator === "not" || operator === "=") {
    if (typeof value === "string" && value.trim() === "") return [];
    return [String(value)];
  }
  return [];
}

export function normKeysFromFilterRawValue(filterValue: unknown, normOpts: NormOpt[]): string[] {
  if (filterValue === undefined || filterValue === null) return [];
  if (Array.isArray(filterValue)) {
    const keys: string[] = [];
    for (const raw of filterValue) {
      const m = normOpts.find((o) => rawMatchesNormOpt(raw, o));
      if (m && !keys.includes(m.value)) keys.push(m.value);
    }
    return keys;
  }
  const m = normOpts.find((o) => rawMatchesNormOpt(filterValue, o));
  return m ? [m.value] : [];
}

export function normalizeValueOptions(options: GridValueOptionsList): NormOpt[] {
  return options.map((o) => {
    if (o !== null && typeof o === "object" && "value" in o) {
      const x = o as { value: string | number; label: string };
      return { value: String(x.value), label: x.label, raw: x.value };
    }
    return { value: String(o), label: String(o), raw: o as string | number };
  });
}

export function textOperators(
  lt: (k: keyof GridLocaleText, fb: string) => string
): FilterOpChoice[] {
  return [
    { value: "contains", label: lt("filterOpContains", "Contém") },
    { value: "equals", label: lt("filterOpEquals", "Igual a") },
    { value: "!=", label: lt("filterOpNotEquals", "Diferente de") },
    { value: "startsWith", label: lt("filterOpStartsWith", "Começa com") },
    { value: "endsWith", label: lt("filterOpEndsWith", "Termina com") },
    { value: "inList", label: lt("filterOpInList", "Lista (a;b;c)") },
    { value: "isEmpty", label: lt("filterEmpty", "Vazio") },
    { value: "isNotEmpty", label: lt("filterNotEmpty", "Não vazio") }
  ];
}

export function numberOperators(lt?: (k: keyof GridLocaleText, fb: string) => string): FilterOpChoice[] {
  const inLabel = lt?.("filterOpInList", "Lista (;)") ?? "Lista (;)";
  return [
    { value: "=", label: "=" },
    { value: "!=", label: "≠" },
    { value: ">", label: ">" },
    { value: ">=", label: "≥" },
    { value: "<", label: "<" },
    { value: "<=", label: "≤" },
    { value: "inList", label: inLabel }
  ];
}

export function enumLikeOperators(
  lt: (k: keyof GridLocaleText, fb: string) => string
): FilterOpChoice[] {
  return [
    { value: "equals", label: lt("filterOpEquals", "Igual a") },
    { value: "!=", label: lt("filterOpNotEquals", "Diferente de") },
    { value: "selectAny", label: lt("filterOpSelectAny", "Seleção (ou)") },
    { value: "selectAll", label: lt("filterOpSelectAll", "Seleção (e)") },
    { value: "inList", label: lt("filterOpInList", "Lista (a;b;c)") },
    { value: "isEmpty", label: lt("filterEmpty", "Vazio") },
    { value: "isNotEmpty", label: lt("filterNotEmpty", "Não vazio") }
  ];
}

export function dateOperators(
  lt: (k: keyof GridLocaleText, fb: string) => string
): FilterOpChoice[] {
  return [
    { value: "is", label: lt("filterOpIs", "É") },
    { value: "not", label: lt("filterOpNot", "Não é") },
    { value: "after", label: lt("filterOpAfter", "Depois de") },
    { value: "onOrAfter", label: lt("filterOpOnOrAfter", "Em ou depois de") },
    { value: "before", label: lt("filterOpBefore", "Antes de") },
    { value: "onOrBefore", label: lt("filterOpOnOrBefore", "Em ou antes de") },
    { value: "isEmpty", label: lt("filterEmpty", "Vazio") },
    { value: "isNotEmpty", label: lt("filterNotEmpty", "Não vazio") }
  ];
}

export function getFilterOperatorChoices<R extends GridValidRowModel>(
  colDef: GridColDef<R> | undefined,
  lt: (k: keyof GridLocaleText, fb: string) => string
): FilterOpChoice[] {
  if (!colDef) return textOperators(lt);
  const isNumber = colDef.type === "number";
  const isBoolean = colDef.type === "boolean";
  const isDate = colDef.type === "date";
  const isDateTime = colDef.type === "dateTime";
  const isDateKind = isDate || isDateTime;
  const isSingleSelect =
    colDef.type === "singleSelect" && colDef != null && colHasFilterableSingleSelect(colDef);
  if (isSingleSelect) return enumLikeOperators(lt);
  if (isBoolean) return enumLikeOperators(lt);
  if (isDateKind) return dateOperators(lt);
  if (isNumber) return numberOperators(lt);
  return textOperators(lt);
}

export function defaultFilterOperatorForCol<R extends GridValidRowModel>(
  colDef: GridColDef<R> | undefined
): GridFilterOperator {
  if (!colDef) return "contains";
  if (colDef.type === "number") return "=";
  if (colDef.type === "date" || colDef.type === "dateTime") return "is";
  if (colDef.type === "singleSelect" && colHasFilterableSingleSelect(colDef)) return "equals";
  if (colDef.type === "boolean") return "equals";
  return "contains";
}

export function buildCommittedFilterItem<R extends GridValidRowModel>(args: {
  colDef: GridColDef<R> | undefined;
  field: string;
  operator: GridFilterOperator;
  valueText: string;
  normOpts: NormOpt[];
  /** Valores `normOpts.value` seleccionados para `selectAny` / `selectAll`. */
  multiValues?: string[];
}): { field: string; operator: GridFilterOperator; value?: unknown } | null {
  const { colDef, field, operator, valueText, normOpts, multiValues } = args;
  const isNumber = colDef?.type === "number";
  const isBoolean = colDef?.type === "boolean";
  const isDate = colDef?.type === "date";
  const isDateTime = colDef?.type === "dateTime";
  const isDateKind = isDate || isDateTime;
  const isSingleSelect =
    colDef?.type === "singleSelect" && colDef != null && colHasFilterableSingleSelect(colDef);

  if (operator === "isEmpty" || operator === "isNotEmpty") {
    return { field, operator };
  }
  if (isSingleSelect) {
    if (operator === "inList") {
      return { field, operator: "inList", value: valueText.trim() };
    }
    if (operator === "selectAny" || operator === "selectAll") {
      const keys = multiValues?.length ? multiValues : [];
      if (keys.length === 0) return { field, operator, value: [] };
      const raw = keys
        .map((k) => {
          const o = normOpts.find((x) => x.value === k);
          if (o && o.raw !== undefined && o.raw !== null) return o.raw;
          const n = Number(k);
          return Number.isFinite(n) ? n : undefined;
        })
        .filter((x): x is string | number => x !== undefined);
      if (raw.length === 0) return { field, operator, value: [] };
      return { field, operator, value: raw };
    }
    if (operator !== "equals" && operator !== "!=") return null;
    const m = normOpts.find((o) => o.value === valueText);
    if (!m) return null;
    return { field, operator, value: m.raw };
  }
  if (isBoolean) {
    if (operator !== "equals" && operator !== "!=") return null;
    return { field, operator, value: valueText === "true" };
  }
  if (isNumber) {
    if (operator === "inList") {
      return { field, operator: "inList", value: valueText.trim() };
    }
    const n = Number(valueText.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return { field, operator, value: n };
  }
  if (isDateKind) {
    if (valueText.trim() === "") return null;
    return { field, operator, value: valueText.trim() };
  }
  if (operator === "inList") {
    return { field, operator: "inList", value: valueText.trim() };
  }
  if (valueText.trim() === "") return null;
  return { field, operator, value: valueText };
}

export function filterRowValueStateFromItem<R extends GridValidRowModel>(args: {
  item: { field: string; operator: GridFilterOperator; value?: unknown };
  colDef: GridColDef<R> | undefined;
  normOpts: NormOpt[];
  isSingleSelect: boolean;
  isBoolean: boolean;
  isDateKind: boolean;
  isNumber: boolean;
  isDateTime: boolean;
}): string {
  const { item, colDef, normOpts, isSingleSelect, isBoolean, isDateKind, isNumber, isDateTime } =
    args;
  const existing = item;
  if (existing.operator === "isEmpty" || existing.operator === "isNotEmpty") return "";
  if (isSingleSelect && existing.operator === "inList") {
    return String(existing.value ?? "");
  }
  if (isSingleSelect && (existing.operator === "selectAny" || existing.operator === "selectAll")) {
    return "";
  }
  if (!isSingleSelect && existing.operator === "inList") {
    return String(existing.value ?? "");
  }
  if (isSingleSelect && (existing.operator === "equals" || existing.operator === "!=")) {
    const v = existing.value;
    const m = normOpts.find(
      (o) =>
        Object.is(o.raw, v) ||
        String(o.raw) === String(v) ||
        o.value === String(v)
    );
    if (m) return m.value;
    /** `singleSelect` assíncrono: `normOpts` pode ainda estar vazio — manter chave estável para o id. */
    if (v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "")) {
      return String(v);
    }
    return normOpts[0]?.value ?? "";
  }
  if (isBoolean && (existing.operator === "equals" || existing.operator === "!=")) {
    const v = existing.value;
    return v === true || v === "true" || String(v).toLowerCase() === "true" ? "true" : "false";
  }
  if (existing.value === undefined || existing.value === null) return "";
  if (existing.value instanceof Date) {
    if (isDateTime) {
      const d = existing.value;
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return existing.value.toISOString().slice(0, 10);
  }
  return String(existing.value);
}

export const FILTER_ROW_DUMMY_ROW_ID = "__hive_filter_row__" as GridRowId;

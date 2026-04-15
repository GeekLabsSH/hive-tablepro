import type {
  GridColDef,
  GridFilterOperator,
  GridLocaleText,
  GridRowId,
  GridValidRowModel,
  GridValueOptionsList
} from "./types";
import { colHasValueOptions } from "./adapter";

export type FilterOpChoice = { value: GridFilterOperator; label: string };

export type NormOpt = { value: string; label: string; raw: string | number };

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
    { value: "startsWith", label: lt("filterOpStartsWith", "Começa com") },
    { value: "endsWith", label: lt("filterOpEndsWith", "Termina com") },
    { value: "isEmpty", label: lt("filterEmpty", "Vazio") },
    { value: "isNotEmpty", label: lt("filterNotEmpty", "Não vazio") }
  ];
}

export function numberOperators(): FilterOpChoice[] {
  return [
    { value: "=", label: "=" },
    { value: "!=", label: "≠" },
    { value: ">", label: ">" },
    { value: ">=", label: "≥" },
    { value: "<", label: "<" },
    { value: "<=", label: "≤" }
  ];
}

export function enumLikeOperators(
  lt: (k: keyof GridLocaleText, fb: string) => string
): FilterOpChoice[] {
  return [
    { value: "equals", label: lt("filterOpEquals", "Igual a") },
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
    colDef.type === "singleSelect" && colDef != null && colHasValueOptions(colDef);
  if (isSingleSelect) return enumLikeOperators(lt);
  if (isBoolean) return enumLikeOperators(lt);
  if (isDateKind) return dateOperators(lt);
  if (isNumber) return numberOperators();
  return textOperators(lt);
}

export function defaultFilterOperatorForCol<R extends GridValidRowModel>(
  colDef: GridColDef<R> | undefined
): GridFilterOperator {
  if (!colDef) return "contains";
  if (colDef.type === "number") return "=";
  if (colDef.type === "date" || colDef.type === "dateTime") return "is";
  if (colDef.type === "singleSelect" && colHasValueOptions(colDef)) return "equals";
  if (colDef.type === "boolean") return "equals";
  return "contains";
}

export function buildCommittedFilterItem<R extends GridValidRowModel>(args: {
  colDef: GridColDef<R> | undefined;
  field: string;
  operator: GridFilterOperator;
  valueText: string;
  normOpts: NormOpt[];
}): { field: string; operator: GridFilterOperator; value?: unknown } | null {
  const { colDef, field, operator, valueText, normOpts } = args;
  const isNumber = colDef?.type === "number";
  const isBoolean = colDef?.type === "boolean";
  const isDate = colDef?.type === "date";
  const isDateTime = colDef?.type === "dateTime";
  const isDateKind = isDate || isDateTime;
  const isSingleSelect =
    colDef?.type === "singleSelect" && colDef != null && colHasValueOptions(colDef);

  if (operator === "isEmpty" || operator === "isNotEmpty") {
    return { field, operator };
  }
  if (isSingleSelect) {
    if (operator !== "equals") return null;
    const m = normOpts.find((o) => o.value === valueText);
    if (!m) return null;
    return { field, operator: "equals", value: m.raw };
  }
  if (isBoolean) {
    if (operator !== "equals") return null;
    return { field, operator: "equals", value: valueText === "true" };
  }
  if (isNumber) {
    const n = Number(valueText.replace(",", "."));
    if (!Number.isFinite(n)) return null;
    return { field, operator, value: n };
  }
  if (isDateKind) {
    if (valueText.trim() === "") return null;
    return { field, operator, value: valueText.trim() };
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
  if (isSingleSelect && existing.operator === "equals") {
    const v = existing.value;
    const m = normOpts.find(
      (o) =>
        Object.is(o.raw, v) ||
        String(o.raw) === String(v) ||
        o.value === String(v)
    );
    return m?.value ?? normOpts[0]?.value ?? "";
  }
  if (isBoolean && existing.operator === "equals") {
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

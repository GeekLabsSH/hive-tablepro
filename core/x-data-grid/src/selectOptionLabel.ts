import type { GridColDef, GridValueOptionsList, GridValidRowModel } from "./types";

export type HiveSelectOptionNorm = { value: string; label: string; raw: string | number };

export function normalizeSelectOptions(options: GridValueOptionsList): HiveSelectOptionNorm[] {
  return options.map((o) => {
    if (o !== null && typeof o === "object" && "value" in o) {
      const x = o as { value: string | number; label: string };
      return { value: String(x.value), label: x.label, raw: x.value };
    }
    return { value: String(o), label: String(o), raw: o as string | number };
  });
}

export function coerceSelectPrimitive(value: unknown): unknown {
  if (value != null && typeof value === "object" && !Array.isArray(value) && "value" in (value as object)) {
    return (value as { value: unknown }).value;
  }
  return value;
}

export function matchSelectOption(
  opts: HiveSelectOptionNorm[],
  value: unknown
): HiveSelectOptionNorm | undefined {
  if (opts.length === 0) return undefined;
  const coerced = coerceSelectPrimitive(value);
  const byPrimitive = opts.find(
    (o) =>
      Object.is(o.raw, coerced) ||
      Object.is(o.raw, value) ||
      String(o.raw) === String(coerced) ||
      o.value === String(coerced) ||
      (typeof o.raw === "number" &&
        typeof coerced === "string" &&
        coerced.trim() !== "" &&
        !Number.isNaN(Number(coerced)) &&
        o.raw === Number(coerced)) ||
      (typeof o.raw === "number" &&
        typeof coerced === "number" &&
        !Number.isNaN(coerced) &&
        o.raw === coerced) ||
      (o.raw != null &&
        coerced != null &&
        typeof o.raw !== "object" &&
        typeof coerced !== "object" &&
        (o.raw as unknown) == (coerced as unknown))
  );
  if (byPrimitive) return byPrimitive;
  const vStr = coerced == null ? "" : String(coerced).trim();
  if (!vStr.length) return undefined;
  const vLower = vStr.toLowerCase();
  return opts.find((o) => o.label.trim() === vStr || o.label.trim().toLowerCase() === vLower);
}

/** Rótulo para exibição (célula / cabeçalho pivot) a partir de `valueOptions` estáticos. */
export function resolveSingleSelectDisplayLabel<R extends GridValidRowModel>(
  colDef: GridColDef<R> | undefined,
  value: unknown
): string {
  if (!colDef || colDef.type !== "singleSelect") {
    if (value == null || value === "") return "";
    if (typeof value === "object") return "";
    return String(value);
  }
  const vo = colDef.valueOptions;
  const list: GridValueOptionsList = typeof vo === "function" ? [] : (vo ?? []);
  const opts = normalizeSelectOptions(list);
  if (opts.length === 0) {
    const c = coerceSelectPrimitive(value);
    if (c == null || c === "") return "";
    if (typeof c === "object") return "";
    return String(c);
  }
  const m = matchSelectOption(opts, value);
  if (m?.label != null && String(m.label).trim().length > 0) return m.label;
  const c = coerceSelectPrimitive(value);
  if (c == null || c === "") return "";
  if (typeof c === "object") return "";
  return String(c);
}

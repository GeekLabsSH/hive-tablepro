import { parseFlexibleNumber } from "./flexibleNumberParse";
import type { GridColDef, GridPivotAggFunc, GridPivotModel, GridValidRowModel } from "./types";

function num(v: unknown): number {
  return parseFlexibleNumber(v);
}

function applyNumericAgg(values: number[], agg: "sum" | "avg" | "min" | "max"): number {
  const nums = values.filter((x) => Number.isFinite(x));
  if (nums.length === 0) return 0;
  switch (agg) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
    default:
      return 0;
  }
}

/** Desvio padrão amostral (n−1); 0 se n≤1 ou sem valores finitos. */
function sampleStdDev(nums: number[]): number {
  const n = nums.length;
  if (n <= 1) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / n;
  let ss = 0;
  for (const x of nums) ss += (x - mean) ** 2;
  return Math.sqrt(ss / (n - 1));
}

function medianOf(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 1) return s[mid]!;
  return (s[mid - 1]! + s[mid]!) / 2;
}

function distinctRawKey(v: unknown): string {
  if (v == null) return "\0__null__";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Rótulos PT alinhados ao painel de pivotagem (métricas). */
export const PIVOT_AGG_FUNC_LABELS_PT: Record<GridPivotAggFunc, string> = {
  sum: "soma",
  avg: "média",
  min: "mín",
  max: "máx",
  median: "mediana",
  stdDev: "desvio padrão",
  count: "contagem",
  countDistinct: "contagem distinta"
};

/** Ordem das agregações quando a coluna é tratada como numérica. */
export const PIVOT_NUMERIC_AGG_ORDER: GridPivotAggFunc[] = [
  "sum",
  "avg",
  "min",
  "max",
  "median",
  "stdDev",
  "count",
  "countDistinct"
];

const SAMPLE_MAX_DEFAULT = 400;
const SAMPLE_MIN_FOR_HEURISTIC = 8;
const NUMERIC_RATIO_THRESHOLD = 0.85;

export type PivotAggFieldOpts = {
  /** Amostra de valores da coluna (ex.: linhas filtradas) para inferir tipo numérico sem `type: "number"`. */
  valueSample?: unknown[];
};

function isLikelyIdField(field: string): boolean {
  if (skipPivotLayoutField(field)) return true;
  if (/^id$/i.test(field)) return true;
  if (/^id[A-Z_]/.test(field)) return true;
  if (/Id$/i.test(field) && field.length > 2) return true;
  return false;
}

function isSemanticallyNonNumericColumn<R extends GridValidRowModel>(cd: GridColDef<R> | undefined): boolean {
  if (!cd) return true;
  const t = cd.type;
  if (t === "date" || t === "dateTime" || t === "singleSelect" || t === "boolean" || t === "actions") return true;
  if (cd.getActions != null) return true;
  return false;
}

function numericFiniteRatioInSample(sample: unknown[]): number {
  if (sample.length === 0) return 0;
  let ok = 0;
  for (const v of sample) {
    if (Number.isFinite(parseFlexibleNumber(v))) ok++;
  }
  return ok / sample.length;
}

/**
 * Amostra dos valores de `field` nas primeiras linhas (limite por defeito 400).
 */
export function buildPivotValueSampleFromRows<R extends GridValidRowModel>(
  rows: R[] | undefined,
  field: string,
  maxLen: number = SAMPLE_MAX_DEFAULT
): unknown[] {
  if (!rows || rows.length === 0) return [];
  const out: unknown[] = [];
  const n = Math.min(rows.length, maxLen);
  for (let i = 0; i < n; i++) {
    out.push((rows[i] as Record<string, unknown>)[field]);
  }
  return out;
}

/**
 * Se a coluna deve oferecer agregações numéricas (soma, média, …) além de contagens.
 */
export function treatsColumnAsNumericPivotMetric<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined,
  opts?: PivotAggFieldOpts
): boolean {
  if (!cd) return false;
  if (isSemanticallyNonNumericColumn(cd)) return false;
  if (cd.type === "number") return true;
  if (isLikelyIdField(cd.field)) return false;
  const sample = opts?.valueSample ?? [];
  if (sample.length < SAMPLE_MIN_FOR_HEURISTIC) return false;
  return numericFiniteRatioInSample(sample) >= NUMERIC_RATIO_THRESHOLD;
}

/**
 * Aplica a mesma agregação que o motor de pivotagem a uma lista de valores brutos de célula.
 */
export function applyPivotAggToRawValues(rawValues: unknown[], agg: GridPivotAggFunc): number {
  const nums = rawValues.map((v) => num(v)).filter((n) => Number.isFinite(n));
  switch (agg) {
    case "count":
      return rawValues.length;
    case "countDistinct": {
      const set = new Set<string>();
      for (const v of rawValues) set.add(distinctRawKey(v));
      return set.size;
    }
    case "sum":
    case "avg":
    case "min":
    case "max":
      if (nums.length === 0) return 0;
      return applyNumericAgg(nums, agg);
    case "median":
      return medianOf(nums);
    case "stdDev":
      return sampleStdDev(nums);
    default:
      return 0;
  }
}

export function skipPivotLayoutField(f: string): boolean {
  return f === "__select__" || f === "__detail__" || f === "__tree__" || f.startsWith("pivot_");
}

/** Campos que podem ir a Linhas/Colunas/Valores (excepto acções e meta). */
export function isPivotAxisCandidate<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  if (c.hide === true) return false;
  if (skipPivotLayoutField(c.field)) return false;
  if (c.type === "actions" || c.getActions != null) return false;
  return true;
}

/** Qualquer eixo pode ser métrica com contagem / contagem distinta; numéricos também soma, média, etc. */
export function canAddFieldToPivotValues<R extends GridValidRowModel>(c: GridColDef<R> | undefined): boolean {
  return !!c && isPivotAxisCandidate(c);
}

export function defaultAggForPivotValueField<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined,
  opts?: PivotAggFieldOpts
): GridPivotAggFunc {
  if (treatsColumnAsNumericPivotMetric(cd, opts)) return "sum";
  return "count";
}

export function aggChoicesForPivotValueField<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined,
  opts?: PivotAggFieldOpts
): GridPivotAggFunc[] {
  if (!cd) return ["count", "countDistinct"];
  if (isSemanticallyNonNumericColumn(cd)) return ["count", "countDistinct"];
  if (treatsColumnAsNumericPivotMetric(cd, opts)) return [...PIVOT_NUMERIC_AGG_ORDER];
  return ["count", "countDistinct"];
}

export function sanitizePivotValueAggs<R extends GridValidRowModel>(
  model: GridPivotModel,
  sourceColumns: GridColDef<R>[],
  sourceRows?: R[]
): GridPivotModel {
  const colBy = new Map(sourceColumns.map((c) => [c.field, c]));
  return {
    ...model,
    values: model.values.map((v) => {
      const cd = colBy.get(v.field);
      const valueSample = buildPivotValueSampleFromRows(sourceRows, v.field);
      const fieldOpts: PivotAggFieldOpts = { valueSample };
      const allowed = aggChoicesForPivotValueField(cd, fieldOpts);
      if (allowed.includes(v.aggFunc)) return v;
      return { ...v, aggFunc: defaultAggForPivotValueField(cd, fieldOpts) };
    })
  };
}

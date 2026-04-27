import { ChevronDownIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import * as React from "react";
import { Button } from "../../../src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../../../src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../../src/components/ui/dropdown-menu";
import { gridParseCellDate, pivotDimensionDisplayLabel, pivotDimensionKey } from "./pivotDateGranularity";
import {
  applyPivotAggToRawValues,
  aggChoicesForPivotValueField,
  buildPivotValueSampleFromRows,
  canAddFieldToPivotValues,
  defaultAggForPivotValueField,
  PIVOT_AGG_FUNC_LABELS_PT,
  treatsColumnAsNumericPivotMetric
} from "./pivotValueAggUtils";
import { resolveSingleSelectDisplayLabel } from "./selectOptionLabel";
import type {
  GridChartsConfig,
  GridChartsDatasetKind,
  GridChartsDateFilter,
  GridChartsDateFilterMode,
  GridColDef,
  GridPivotAggFunc,
  GridPivotDateGranularity,
  GridPivotRowDef,
  GridValidRowModel
} from "./types";

const MAX_CHART_SERIES = 6;

const CHART_KIND_LABELS: Record<GridChartsDatasetKind, string> = {
  bar: "Barras",
  line: "Linhas",
  area: "Áreas"
};

const DATE_FILTER_MODE_LABELS: Record<GridChartsDateFilterMode, string> = {
  off: "Sem filtro de data",
  exact: "Data específica",
  range: "Intervalo de datas"
};

const CAT_DATE_GRAN_OPTIONS: { value: "" | GridPivotDateGranularity; label: string }[] = [
  { value: "", label: "Dia (calendário)" },
  { value: "week", label: "Semana (segunda a domingo)" },
  { value: "month", label: "Mês" },
  { value: "quarter", label: "Trimestre" },
  { value: "semester", label: "Semestre" },
  { value: "year", label: "Ano" }
];

const SERIE_COLORS = ["#3b82f6", "#22c55e", "#ca8a04", "#a855f7", "#f97316", "#14b8a6"];

function skipChartField(f: string): boolean {
  return f === "__select__" || f === "__detail__" || f === "__tree__" || f.startsWith("pivot_");
}

function isDateLikeCol<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  return c.type === "date" || c.type === "dateTime";
}

function isCategoryColumn<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  if (skipChartField(c.field)) return false;
  if (c.type === "actions" || c.getActions != null) return false;
  if (c.type === "number") return false;
  return true;
}

function pickDefaultFields<R extends GridValidRowModel>(
  columns: GridColDef<R>[],
  rows: R[]
): { categoryField: string; valueField: string } | null {
  const cat = columns.find(isCategoryColumn)?.field ?? null;
  const pivotVals = columns.filter(canAddFieldToPivotValues);
  const val =
    pivotVals.find((c) => c.type === "number")?.field ??
    pivotVals.find((c) =>
      treatsColumnAsNumericPivotMetric(c, {
        valueSample: buildPivotValueSampleFromRows(rows, c.field)
      })
    )?.field ??
    pivotVals[0]?.field ??
    null;
  if (!cat || !val) return null;
  return { categoryField: cat, valueField: val };
}

function sanitizeChartValueAgg<R extends GridValidRowModel>(
  valueField: string,
  agg: GridPivotAggFunc,
  columns: GridColDef<R>[],
  rows: R[]
): GridPivotAggFunc {
  const cd = columns.find((c) => c.field === valueField);
  const fieldOpts = { valueSample: buildPivotValueSampleFromRows(rows, valueField) };
  const allowed = aggChoicesForPivotValueField(cd, fieldOpts);
  return allowed.includes(agg) ? agg : defaultAggForPivotValueField(cd, fieldOpts);
}

function startOfLocalDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseYmdToLocalStart(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null;
  const t = new Date(y, mo - 1, da).getTime();
  return Number.isNaN(t) ? null : t;
}

function rowPassesDateFilter<R extends GridValidRowModel>(
  row: R,
  filter: Pick<GridChartsDateFilter, "field" | "mode" | "exactDate" | "rangeStart" | "rangeEnd">
): boolean {
  if (!filter || filter.mode === "off" || !filter.field) return true;
  const raw = (row as Record<string, unknown>)[filter.field];
  const d = gridParseCellDate(raw);
  if (!d) return false;
  const rowDay = startOfLocalDayMs(d);
  if (filter.mode === "exact") {
    if (!filter.exactDate) return true;
    const target = parseYmdToLocalStart(filter.exactDate);
    return target != null && rowDay === target;
  }
  if (filter.mode === "range") {
    const lo = filter.rangeStart ? parseYmdToLocalStart(filter.rangeStart) : null;
    const hi = filter.rangeEnd ? parseYmdToLocalStart(filter.rangeEnd) : null;
    const minT = lo ?? -Infinity;
    const maxT = hi ?? Infinity;
    return rowDay >= minT && rowDay <= maxT;
  }
  return true;
}

function rowCategoryKeyLabel<R extends GridValidRowModel>(
  row: R,
  categoryField: string,
  columns: GridColDef<R>[],
  categoryDateGranularity: "" | GridPivotDateGranularity
): { key: string; label: string } {
  const catCol = columns.find((c) => c.field === categoryField);
  const raw = (row as Record<string, unknown>)[categoryField];
  if (catCol && isDateLikeCol(catCol)) {
    if (categoryDateGranularity !== "") {
      const def: GridPivotRowDef = { field: categoryField, dateGranularity: categoryDateGranularity };
      const key = pivotDimensionKey(row, def, catCol);
      const label = pivotDimensionDisplayLabel(key === "" ? "" : key, def, catCol);
      return { key: key || "—", label: label || "—" };
    }
    const d = gridParseCellDate(raw);
    if (!d) return { key: "—", label: "—" };
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${mo}-${da}`;
    return { key, label: key };
  }
  if (catCol?.type === "singleSelect") {
    const label = resolveSingleSelectDisplayLabel(catCol, raw);
    const k = (label && String(label).trim()) || "—";
    return { key: k, label: k };
  }
  const name = String(raw ?? "");
  const label = (name && name.trim()) || "—";
  return { key: label, label };
}

function sortCategoryKeys(keys: string[], isDateCat: boolean): string[] {
  const copy = [...keys];
  if (isDateCat) {
    copy.sort((a, b) => a.localeCompare(b, "en-CA"));
    return copy;
  }
  copy.sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  return copy;
}

type SeriesRow = { id: string; field: string; agg: GridPivotAggFunc };

function newSeriesId(): string {
  return `sr-${Math.random().toString(36).slice(2, 10)}`;
}

function seriesFromConfig<R extends GridValidRowModel>(
  config: GridChartsConfig | undefined,
  defaults: { categoryField: string; valueField: string } | null,
  columns: GridColDef<R>[],
  rows: R[]
): SeriesRow[] {
  const valueFieldSet = new Set(columns.filter(canAddFieldToPivotValues).map((c) => c.field));

  const vs = config?.valueSeries;
  if (vs && vs.length > 0) {
    const mapped = vs.slice(0, MAX_CHART_SERIES)
      .filter((s) => valueFieldSet.has(s.field))
      .map((s, i) => {
        const cd = columns.find((c) => c.field === s.field);
        const fo = { valueSample: buildPivotValueSampleFromRows(rows, s.field) };
        return {
          id: `cfg-${i}-${s.field}`,
          field: s.field,
          agg: sanitizeChartValueAgg(
            s.field,
            s.aggFunc ?? defaultAggForPivotValueField(cd, fo),
            columns,
            rows
          )
        };
      });
    if (mapped.length > 0) return mapped;
  }
  const vf = config?.valueField ?? defaults?.valueField ?? "";
  if (!vf || !valueFieldSet.has(vf)) return [];
  const cdVf = columns.find((c) => c.field === vf);
  const foVf = { valueSample: buildPivotValueSampleFromRows(rows, vf) };
  return [
    {
      id: "sr-0",
      field: vf,
      agg: sanitizeChartValueAgg(
        vf,
        config?.valueAggFunc ?? defaultAggForPivotValueField(cdVf, foVf),
        columns,
        rows
      )
    }
  ];
}

function buildChartDataset<R extends GridValidRowModel>(
  rows: R[],
  categoryField: string,
  categoryDateGranularity: "" | GridPivotDateGranularity,
  series: SeriesRow[],
  columns: GridColDef<R>[],
  dateFilter: Pick<GridChartsDateFilter, "field" | "mode" | "exactDate" | "rangeStart" | "rangeEnd">
): Record<string, string | number>[] {
  if (!categoryField || series.length === 0) return [];
  const catCol = columns.find((c) => c.field === categoryField);
  const isDateCat = !!(catCol && isDateLikeCol(catCol));

  const byKey = new Map<
    string,
    {
      label: string;
      buckets: Map<number, unknown[]>;
    }
  >();

  for (const row of rows) {
    if (!rowPassesDateFilter(row, dateFilter)) continue;
    const { key, label } = rowCategoryKeyLabel(row, categoryField, columns, categoryDateGranularity);
    let cell = byKey.get(key);
    if (!cell) {
      cell = { label, buckets: new Map() };
      byKey.set(key, cell);
    }
    series.forEach((s, idx) => {
      const arr = cell!.buckets.get(idx) ?? [];
      arr.push((row as Record<string, unknown>)[s.field]);
      cell!.buckets.set(idx, arr);
    });
  }

  const keys = sortCategoryKeys([...byKey.keys()], isDateCat).slice(0, 200);
  return keys.map((key) => {
    const cell = byKey.get(key)!;
    const point: Record<string, string | number> = { name: cell.label };
    series.forEach((s, idx) => {
      const rawVals = cell.buckets.get(idx) ?? [];
      const agg = sanitizeChartValueAgg(s.field, s.agg, columns, rows);
      point[`s${idx}`] = applyPivotAggToRawValues(rawVals, agg);
    });
    return point;
  });
}

function colLabel<R extends GridValidRowModel>(c: GridColDef<R>): string {
  return (c.headerName ?? c.field).trim() || c.field;
}

function serieLegendLabel<R extends GridValidRowModel>(s: SeriesRow, columns: GridColDef<R>[]): string {
  const cd = columns.find((c) => c.field === s.field);
  return `${colLabel(cd ?? ({ field: s.field } as GridColDef<R>))} · ${PIVOT_AGG_FUNC_LABELS_PT[s.agg]}`;
}

type DateFilterDraft = {
  field: string;
  mode: GridChartsDateFilterMode;
  exactDate: string;
  rangeStart: string;
  rangeEnd: string;
};

function normalizeChartKind(k: string | undefined): GridChartsDatasetKind {
  if (k === "line" || k === "area") return k;
  return "bar";
}

export function GridDefaultChartsPanel<R extends GridValidRowModel>(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: R[];
  columns: GridColDef<R>[];
  config: GridChartsConfig | undefined;
  title?: string;
}) {
  const { open, onOpenChange, rows, columns, config, title = "Gráfico (dados visíveis)" } = props;
  const [Recharts, setRecharts] = React.useState<typeof import("recharts") | null>(null);

  const defaults = React.useMemo(() => pickDefaultFields(columns, rows), [columns, rows]);
  const [chartKind, setChartKind] = React.useState<GridChartsDatasetKind>(() =>
    normalizeChartKind(config?.defaultKind)
  );
  const [categoryField, setCategoryField] = React.useState(() => config?.categoryField ?? defaults?.categoryField ?? "");
  const [categoryDateGranularity, setCategoryDateGranularity] = React.useState<"" | GridPivotDateGranularity>(
    () => config?.categoryDateGranularity ?? ""
  );
  const [series, setSeries] = React.useState<SeriesRow[]>(() => seriesFromConfig(config, defaults, columns, rows));
  const [dateFilter, setDateFilter] = React.useState<DateFilterDraft>(() => ({
    field: config?.dateFilter?.field ?? "",
    mode: config?.dateFilter?.mode ?? "off",
    exactDate: config?.dateFilter?.exactDate ?? "",
    rangeStart: config?.dateFilter?.rangeStart ?? "",
    rangeEnd: config?.dateFilter?.rangeEnd ?? ""
  }));

  React.useEffect(() => {
    if (!open) return;
    const d = pickDefaultFields(columns, rows);
    setChartKind(normalizeChartKind(config?.defaultKind));
    setCategoryField(config?.categoryField ?? d?.categoryField ?? "");
    setCategoryDateGranularity(config?.categoryDateGranularity ?? "");
    setSeries(seriesFromConfig(config, d, columns, rows));
    setDateFilter({
      field: config?.dateFilter?.field ?? "",
      mode: config?.dateFilter?.mode ?? "off",
      exactDate: config?.dateFilter?.exactDate ?? "",
      rangeStart: config?.dateFilter?.rangeStart ?? "",
      rangeEnd: config?.dateFilter?.rangeEnd ?? ""
    });
  }, [
    open,
    config?.defaultKind,
    config?.categoryField,
    config?.categoryDateGranularity,
    config?.valueField,
    config?.valueAggFunc,
    config?.valueSeries,
    config?.dateFilter?.field,
    config?.dateFilter?.mode,
    config?.dateFilter?.exactDate,
    config?.dateFilter?.rangeStart,
    config?.dateFilter?.rangeEnd,
    columns,
    rows
  ]);

  React.useEffect(() => {
    let cancelled = false;
    void import("recharts")
      .then((m) => {
        if (!cancelled) setRecharts(m);
      })
      .catch(() => {
        if (!cancelled) setRecharts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const categoryColumns = React.useMemo(() => columns.filter(isCategoryColumn), [columns]);
  const valueColumns = React.useMemo(() => columns.filter(canAddFieldToPivotValues), [columns]);

  React.useEffect(() => {
    const valid = new Set(valueColumns.map((c) => c.field));
    if (valid.size === 0) return;
    setSeries((prev) => {
      let changed = false;
      const out = prev.map((s) => {
        if (valid.has(s.field)) return s;
        changed = true;
        const nf = valueColumns[0]!.field;
        return {
          ...s,
          field: nf,
          agg: sanitizeChartValueAgg(nf, s.agg, columns, rows)
        };
      });
      return changed ? out : prev;
    });
  }, [valueColumns, columns, rows]);

  const dateColumns = React.useMemo(
    () => columns.filter((c) => !skipChartField(c.field) && isDateLikeCol(c)),
    [columns]
  );

  const categoryCol = React.useMemo(
    () => columns.find((c) => c.field === categoryField),
    [columns, categoryField]
  );
  const showCategoryDateGran = !!(categoryCol && isDateLikeCol(categoryCol));

  const dateFilterResolved = React.useMemo(
    () => ({
      field: dateFilter.field,
      mode: dateFilter.mode,
      exactDate: dateFilter.exactDate,
      rangeStart: dateFilter.rangeStart,
      rangeEnd: dateFilter.rangeEnd
    }),
    [dateFilter]
  );

  const chartData = React.useMemo(
    () => buildChartDataset(rows, categoryField, categoryDateGranularity, series, columns, dateFilterResolved),
    [rows, categoryField, categoryDateGranularity, series, columns, dateFilterResolved]
  );

  const canAddSeries = series.length < MAX_CHART_SERIES && valueColumns.length > 0;

  const addSeries = React.useCallback(() => {
    setSeries((prev) => {
      if (prev.length >= MAX_CHART_SERIES) return prev;
      const used = new Set(prev.map((p) => p.field));
      const nextCol = valueColumns.find((c) => !used.has(c.field)) ?? valueColumns[0];
      if (!nextCol) return prev;
      const fo = { valueSample: buildPivotValueSampleFromRows(rows, nextCol.field) };
      const agg = defaultAggForPivotValueField(nextCol, fo);
      return [...prev, { id: newSeriesId(), field: nextCol.field, agg }];
    });
  }, [valueColumns, rows]);

  const removeSeries = React.useCallback((id: string) => {
    setSeries((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));
  }, []);

  const updateSeriesField = React.useCallback(
    (id: string, field: string) => {
      setSeries((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                field,
                agg: sanitizeChartValueAgg(field, s.agg, columns, rows)
              }
            : s
        )
      );
    },
    [columns, rows]
  );

  const updateSeriesAgg = React.useCallback((id: string, agg: GridPivotAggFunc) => {
    setSeries((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, agg: sanitizeChartValueAgg(s.field, agg, columns, rows) };
      })
    );
  }, [columns, rows]);

  const dateInputCls =
    "mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";
  const chartMenuTriggerClass =
    "mt-1 h-9 w-full justify-between gap-2 rounded-md border border-gray-300 bg-white px-2 text-sm font-normal text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800";
  const seriesFieldMenuTriggerClass =
    "h-8 min-w-0 flex-1 justify-between gap-1 rounded-md border border-gray-300 bg-white px-1.5 text-xs font-normal text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800";
  const seriesAggMenuTriggerClass =
    "h-8 max-w-[10rem] shrink-0 justify-between gap-1 rounded-md border border-gray-300 bg-white px-1.5 text-xs font-normal text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800";
  const menuContentClass = "z-[1400] max-h-[min(70vh,20rem)] w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto p-1";

  const hasData = chartData.length > 0 && series.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4 border-b border-gray-200 pb-4 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Configure o tipo de gráfico, a categoria (eixo X), uma ou mais métricas (eixo Y) e, opcionalmente,
              filtre as linhas por uma coluna de data. Os dados incluem todas as linhas que passam o filtro da grelha
              (sem limite de paginação).
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200">Tipo de gráfico</label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className={chartMenuTriggerClass}>
                      <span className="min-w-0 truncate">{CHART_KIND_LABELS[chartKind]}</span>
                      <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className={menuContentClass}>
                    {(Object.keys(CHART_KIND_LABELS) as GridChartsDatasetKind[]).map((k) => (
                      <DropdownMenuItem key={k} onClick={() => setChartKind(normalizeChartKind(k))}>
                        {CHART_KIND_LABELS[k]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200">Categoria (eixo X)</label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className={chartMenuTriggerClass}>
                      <span className="min-w-0 truncate">
                        {categoryField
                          ? colLabel(categoryColumns.find((c) => c.field === categoryField) ?? ({ field: categoryField } as GridColDef<R>))
                          : "—"}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className={menuContentClass}>
                    <DropdownMenuItem
                      onClick={() => {
                        setCategoryField("");
                        setCategoryDateGranularity("");
                      }}
                    >
                      —
                    </DropdownMenuItem>
                    {categoryColumns.map((c) => (
                      <DropdownMenuItem
                        key={c.field}
                        onClick={() => {
                          setCategoryField(c.field);
                          setCategoryDateGranularity("");
                        }}
                      >
                        {colLabel(c)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {showCategoryDateGran ? (
              <div>
                <label className="block text-xs font-medium text-gray-800 dark:text-gray-200">
                  Agrupamento da data no eixo X
                </label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className={chartMenuTriggerClass}>
                      <span className="min-w-0 truncate">
                        {CAT_DATE_GRAN_OPTIONS.find((o) => o.value === categoryDateGranularity)?.label ?? "Dia (calendário)"}
                      </span>
                      <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className={menuContentClass}>
                    {CAT_DATE_GRAN_OPTIONS.map((o) => (
                      <DropdownMenuItem
                        key={o.value || "day-cal"}
                        onClick={() => setCategoryDateGranularity((o.value || "") as "" | GridPivotDateGranularity)}
                      >
                        {o.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}

            <div>
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-gray-800 dark:text-gray-200">Métricas (eixo Y)</label>
                <button
                  type="button"
                  disabled={!canAddSeries}
                  onClick={addSeries}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <PlusIcon className="h-3.5 w-3.5" aria-hidden />
                  Série
                </button>
              </div>
              {valueColumns.length === 0 ? (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Não há colunas disponíveis para métricas (ex.: numéricas ou texto para contagem).
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {series.map((s, idx) => {
                    const cd = columns.find((c) => c.field === s.field);
                    const aggOpts = aggChoicesForPivotValueField(cd, {
                      valueSample: buildPivotValueSampleFromRows(rows, s.field)
                    });
                    const fieldLabel = colLabel(cd ?? ({ field: s.field } as GridColDef<R>));
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-gray-50/80 p-2 dark:border-gray-600 dark:bg-gray-900/40"
                      >
                        <span className="w-5 shrink-0 text-center text-xs text-gray-500 dark:text-gray-400">
                          {idx + 1}
                        </span>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" className={seriesFieldMenuTriggerClass}>
                              <span className="min-w-0 truncate">{fieldLabel}</span>
                              <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className={menuContentClass}>
                            {valueColumns.map((c) => (
                              <DropdownMenuItem key={c.field} onClick={() => updateSeriesField(s.id, c.field)}>
                                {colLabel(c)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="outline" className={seriesAggMenuTriggerClass}>
                              <span className="min-w-0 truncate">{PIVOT_AGG_FUNC_LABELS_PT[s.agg]}</span>
                              <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={menuContentClass}>
                            {aggOpts.map((a) => (
                              <DropdownMenuItem key={a} onClick={() => updateSeriesAgg(s.id, a)}>
                                {PIVOT_AGG_FUNC_LABELS_PT[a]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                          type="button"
                          title="Remover série"
                          disabled={series.length <= 1}
                          onClick={() => removeSeries(s.id)}
                          className="shrink-0 rounded p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {dateColumns.length > 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-white/60 p-3 dark:border-gray-600 dark:bg-gray-950/40">
                <p className="mb-2 text-xs font-medium text-gray-800 dark:text-gray-200">Filtro por data (linhas)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400">Coluna de data</label>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className={chartMenuTriggerClass}>
                          <span className="min-w-0 truncate">
                            {dateFilter.field
                              ? colLabel(dateColumns.find((c) => c.field === dateFilter.field) ?? ({ field: dateFilter.field } as GridColDef<R>))
                              : "—"}
                          </span>
                          <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className={menuContentClass}>
                        <DropdownMenuItem onClick={() => setDateFilter((f) => ({ ...f, field: "" }))}>—</DropdownMenuItem>
                        {dateColumns.map((c) => (
                          <DropdownMenuItem key={c.field} onClick={() => setDateFilter((f) => ({ ...f, field: c.field }))}>
                            {colLabel(c)}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-gray-600 dark:text-gray-400">Modo</label>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className={chartMenuTriggerClass}>
                          <span className="min-w-0 truncate">{DATE_FILTER_MODE_LABELS[dateFilter.mode]}</span>
                          <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className={menuContentClass}>
                        {(Object.keys(DATE_FILTER_MODE_LABELS) as GridChartsDateFilterMode[]).map((m) => (
                          <DropdownMenuItem key={m} onClick={() => setDateFilter((f) => ({ ...f, mode: m }))}>
                            {DATE_FILTER_MODE_LABELS[m]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {dateFilter.mode === "exact" ? (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-gray-600 dark:text-gray-400">Dia</label>
                      <input
                        type="date"
                        className={dateInputCls}
                        value={dateFilter.exactDate}
                        onChange={(e) => setDateFilter((f) => ({ ...f, exactDate: e.target.value }))}
                      />
                    </div>
                  ) : null}
                  {dateFilter.mode === "range" ? (
                    <>
                      <div>
                        <label className="block text-[11px] text-gray-600 dark:text-gray-400">De</label>
                        <input
                          type="date"
                          className={dateInputCls}
                          value={dateFilter.rangeStart}
                          onChange={(e) => setDateFilter((f) => ({ ...f, rangeStart: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-600 dark:text-gray-400">Até</label>
                        <input
                          type="date"
                          className={dateInputCls}
                          value={dateFilter.rangeEnd}
                          onChange={(e) => setDateFilter((f) => ({ ...f, rangeEnd: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="pt-4">
            {!Recharts ? (
              <p className="min-h-[3rem] text-sm text-gray-700 dark:text-gray-200">
                A instalar o motor de gráficos… Se o pacote `recharts` não estiver presente, adicione-o ao
                projecto.
              </p>
            ) : !categoryField || series.length === 0 ? (
              <p className="min-h-[3rem] text-sm text-gray-700 dark:text-gray-200">
                Seleccione uma categoria e pelo menos uma métrica para desenhar o gráfico.
              </p>
            ) : !hasData ? (
              <p className="min-h-[3rem] text-sm text-gray-700 dark:text-gray-200">
                Sem pontos para esta combinação. Ajuste categorias, métricas ou o filtro de datas.
              </p>
            ) : (
              <div className="h-[300px] min-h-[220px] w-full min-w-0 text-gray-900 dark:text-gray-100">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                  {chartKind === "bar" ? (
                    <Recharts.BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                      <Recharts.XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#374151" }}
                        interval={0}
                        angle={series.length > 1 ? -20 : -25}
                        textAnchor="end"
                        height={series.length > 1 ? 64 : 72}
                      />
                      <Recharts.YAxis
                        tick={{ fontSize: 10, fill: "#374151" }}
                        width={48}
                        domain={["auto", "auto"]}
                        allowDataOverflow
                      />
                      <Recharts.Tooltip />
                      <Recharts.Legend wrapperStyle={{ fontSize: 11 }} />
                      {series.map((s, idx) => (
                        <Recharts.Bar
                          key={s.id}
                          dataKey={`s${idx}`}
                          name={serieLegendLabel(s, columns)}
                          fill={SERIE_COLORS[idx % SERIE_COLORS.length]!}
                          radius={[2, 2, 0, 0]}
                        />
                      ))}
                    </Recharts.BarChart>
                  ) : chartKind === "line" ? (
                    <Recharts.LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                      <Recharts.XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#374151" }}
                        interval={0}
                        angle={-22}
                        textAnchor="end"
                        height={68}
                      />
                      <Recharts.YAxis
                        tick={{ fontSize: 10, fill: "#374151" }}
                        width={48}
                        domain={["auto", "auto"]}
                        allowDataOverflow
                      />
                      <Recharts.Tooltip />
                      <Recharts.Legend wrapperStyle={{ fontSize: 11 }} />
                      {series.map((s, idx) => (
                        <Recharts.Line
                          key={s.id}
                          type="monotone"
                          dataKey={`s${idx}`}
                          name={serieLegendLabel(s, columns)}
                          stroke={SERIE_COLORS[idx % SERIE_COLORS.length]!}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                      ))}
                    </Recharts.LineChart>
                  ) : (
                    <Recharts.AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                      <Recharts.XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: "#374151" }}
                        interval={0}
                        angle={-22}
                        textAnchor="end"
                        height={68}
                      />
                      <Recharts.YAxis
                        tick={{ fontSize: 10, fill: "#374151" }}
                        width={48}
                        domain={["auto", "auto"]}
                        allowDataOverflow
                      />
                      <Recharts.Tooltip />
                      <Recharts.Legend wrapperStyle={{ fontSize: 11 }} />
                      {series.map((s, idx) => (
                        <Recharts.Area
                          key={s.id}
                          type="monotone"
                          dataKey={`s${idx}`}
                          name={serieLegendLabel(s, columns)}
                          stroke={SERIE_COLORS[idx % SERIE_COLORS.length]!}
                          fill={SERIE_COLORS[idx % SERIE_COLORS.length]!}
                          fillOpacity={0.35}
                          strokeWidth={2}
                        />
                      ))}
                    </Recharts.AreaChart>
                  )}
                </Recharts.ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

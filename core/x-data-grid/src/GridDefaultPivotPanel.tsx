import * as React from "react";
import { createPortal } from "react-dom";
import { EllipsisVerticalIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../src/components/ui/button";
import { Checkbox } from "../../../src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../../src/components/ui/dropdown-menu";
import { Input } from "../../../src/components/ui/input";
import { cn } from "../../../src/lib/utils";
import type { GridPivotPanelSlotProps } from "./dataGridProps";
import type {
  GridColDef,
  GridPivotAggFunc,
  GridPivotColumnDef,
  GridPivotDateGranularity,
  GridPivotModel,
  GridPivotRowDef,
  GridPivotValueDef,
  GridValidRowModel
} from "./types";
import {
  aggChoicesForPivotValueField,
  canAddFieldToPivotValues,
  defaultAggForPivotValueField,
  isPivotAxisCandidate,
  sanitizePivotValueAggs
} from "./pivotValueAggUtils";

function isDateCol<R extends GridValidRowModel>(c: GridColDef<R> | undefined): boolean {
  return c?.type === "date" || c?.type === "dateTime";
}

function colLabel<R extends GridValidRowModel>(c: GridColDef<R>): string {
  return (c.headerName ?? c.field).trim() || c.field;
}

const AGG_PT: Record<GridPivotAggFunc, string> = {
  sum: "soma",
  avg: "média",
  min: "mín",
  max: "máx",
  count: "contagem",
  countDistinct: "contagem distinta"
};

const DATE_GRAN: { v: GridPivotDateGranularity; l: string }[] = [
  { v: "year", l: "Ano" },
  { v: "quarter", l: "Trimestre" },
  { v: "month", l: "Mês" },
  { v: "day", l: "Dia" }
];

function cloneModel(m: GridPivotModel): GridPivotModel {
  return JSON.parse(JSON.stringify(m)) as GridPivotModel;
}

type Zone = "rows" | "columns" | "values";

export function GridDefaultPivotPanel<R extends GridValidRowModel>(props: GridPivotPanelSlotProps<R>) {
  const { api, open, onOpenChange, pivotModel, onCommitPivotModel } = props;
  const columns = api.getAllColumns();

  const [draft, setDraft] = React.useState<GridPivotModel>(() => cloneModel(pivotModel));
  const [search, setSearch] = React.useState("");
  const [openRows, setOpenRows] = React.useState(true);
  const [openCols, setOpenCols] = React.useState(true);
  const [openVals, setOpenVals] = React.useState(true);
  const lastCommittedRef = React.useRef<GridPivotModel>(cloneModel(pivotModel));

  React.useEffect(() => {
    if (!open) {
      lastCommittedRef.current = cloneModel(pivotModel);
      return;
    }
    const next = sanitizePivotValueAggs(cloneModel(pivotModel), columns);
    setDraft(next);
    lastCommittedRef.current = cloneModel(pivotModel);
  }, [open, pivotModel, columns]);

  const axisCols = React.useMemo(() => columns.filter(isPivotAxisCandidate), [columns]);

  const colByField = React.useCallback((f: string) => axisCols.find((c) => c.field === f), [axisCols]);

  const filteredAvailable = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return axisCols.filter((c) => {
      if (!q) return true;
      return colLabel(c).toLowerCase().includes(q) || c.field.toLowerCase().includes(q);
    });
  }, [axisCols, search]);

  const addRow = (field: string) => {
    const c = colByField(field);
    const next: GridPivotRowDef = { field, hidden: false };
    if (isDateCol(c)) next.dateGranularity = "month";
    setDraft((d) => ({ ...d, rows: [...d.rows, next] }));
  };
  const addCol = (field: string) => {
    const c = colByField(field);
    const next: GridPivotColumnDef = { field, hidden: false };
    if (isDateCol(c)) next.dateGranularity = "month";
    setDraft((d) => ({ ...d, columns: [...d.columns, next] }));
  };
  const addVal = (field: string) => {
    const c = colByField(field);
    const next: GridPivotValueDef = { field, aggFunc: defaultAggForPivotValueField(c), hidden: false };
    setDraft((d) => ({ ...d, values: [...d.values, next] }));
  };

  const removeAt = (zone: Zone, index: number) => {
    setDraft((d) => {
      if (zone === "rows") return { ...d, rows: d.rows.filter((_, i) => i !== index) };
      if (zone === "columns") return { ...d, columns: d.columns.filter((_, i) => i !== index) };
      return { ...d, values: d.values.filter((_, i) => i !== index) };
    });
  };

  const moveAt = (zone: Zone, index: number, target: Zone) => {
    setDraft((d) => {
      if (zone === "rows") {
        const item = d.rows[index];
        if (!item) return d;
        const rest = d.rows.filter((_, i) => i !== index);
        if (target === "rows") return { ...d, rows: rest };
        if (target === "columns")
          return { ...d, rows: rest, columns: [...d.columns, { field: item.field, hidden: item.hidden, dateGranularity: item.dateGranularity }] };
        if (canAddFieldToPivotValues(colByField(item.field)))
          return {
            ...d,
            rows: rest,
            values: [...d.values, { field: item.field, aggFunc: defaultAggForPivotValueField(colByField(item.field)), hidden: false }]
          };
        return { ...d, rows: rest };
      }
      if (zone === "columns") {
        const item = d.columns[index];
        if (!item) return d;
        const rest = d.columns.filter((_, i) => i !== index);
        if (target === "columns") return { ...d, columns: rest };
        if (target === "rows")
          return { ...d, columns: rest, rows: [...d.rows, { field: item.field, hidden: item.hidden, dateGranularity: item.dateGranularity }] };
        if (canAddFieldToPivotValues(colByField(item.field)))
          return {
            ...d,
            columns: rest,
            values: [...d.values, { field: item.field, aggFunc: defaultAggForPivotValueField(colByField(item.field)), hidden: false }]
          };
        return { ...d, columns: rest };
      }
      const item = d.values[index];
      if (!item) return d;
      const rest = d.values.filter((_, i) => i !== index);
      if (target === "values") return { ...d, values: rest };
      if (target === "rows") return { ...d, values: rest, rows: [...d.rows, { field: item.field, hidden: item.hidden }] };
      return { ...d, values: rest, columns: [...d.columns, { field: item.field, hidden: item.hidden }] };
    });
  };

  const shift = (zone: Zone, index: number, delta: number) => {
    setDraft((d) => {
      const arr =
        zone === "rows" ? [...d.rows] : zone === "columns" ? [...d.columns] : [...d.values];
      const j = index + delta;
      if (j < 0 || j >= arr.length) return d;
      const t = arr[index];
      arr[index] = arr[j]!;
      arr[j] = t!;
      if (zone === "rows") return { ...d, rows: arr as GridPivotRowDef[] };
      if (zone === "columns") return { ...d, columns: arr as GridPivotColumnDef[] };
      return { ...d, values: arr as GridPivotValueDef[] };
    });
  };

  const toggleHidden = (zone: Zone, index: number) => {
    setDraft((d) => {
      if (zone === "rows") {
        const rows = d.rows.map((r, i) => (i === index ? { ...r, hidden: !r.hidden } : r));
        return { ...d, rows };
      }
      if (zone === "columns") {
        const cols = d.columns.map((c, i) => (i === index ? { ...c, hidden: !c.hidden } : c));
        return { ...d, columns: cols };
      }
      const vals = d.values.map((v, i) => (i === index ? { ...v, hidden: !v.hidden } : v));
      return { ...d, values: vals };
    });
  };

  const setDateGran = (zone: "rows" | "columns", index: number, g: GridPivotDateGranularity) => {
    setDraft((d) => {
      if (zone === "rows") {
        const rows = d.rows.map((r, i) => (i === index ? { ...r, dateGranularity: g } : r));
        return { ...d, rows };
      }
      const cols = d.columns.map((c, i) => (i === index ? { ...c, dateGranularity: g } : c));
      return { ...d, columns: cols };
    });
  };

  const setAgg = (index: number, agg: GridPivotAggFunc) => {
    setDraft((d) => ({
      ...d,
      values: d.values.map((v, i) => (i === index ? { ...v, aggFunc: agg } : v))
    }));
  };

  const apply = React.useCallback(() => {
    onCommitPivotModel(cloneModel(draft));
    lastCommittedRef.current = cloneModel(draft);
    onOpenChange(false);
  }, [draft, onCommitPivotModel, onOpenChange]);

  const reset = React.useCallback(() => {
    setDraft(cloneModel(lastCommittedRef.current));
  }, []);

  const visibleCount = (zone: Zone) => {
    if (zone === "rows") return draft.rows.filter((r) => !r.hidden).length;
    if (zone === "columns") return draft.columns.filter((c) => !c.hidden).length;
    return draft.values.filter((v) => !v.hidden).length;
  };

  const canApply =
    draft.rows.some((r) => !r.hidden) &&
    draft.columns.some((c) => !c.hidden) &&
    draft.values.some((v) => !v.hidden);

  const zoneMenu = (zone: Zone, index: number, len: number, field: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[1200]">
        <DropdownMenuItem disabled={index === 0} onClick={() => shift(zone, index, -1)}>
          Subir
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index >= len - 1} onClick={() => shift(zone, index, 1)}>
          Descer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {zone !== "rows" ? (
          <DropdownMenuItem onClick={() => moveAt(zone, index, "rows")}>Linhas</DropdownMenuItem>
        ) : null}
        {zone !== "columns" ? (
          <DropdownMenuItem onClick={() => moveAt(zone, index, "columns")}>Colunas</DropdownMenuItem>
        ) : null}
        {zone !== "values" && canAddFieldToPivotValues(colByField(field)) ? (
          <DropdownMenuItem onClick={() => moveAt(zone, index, "values")}>Valores</DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onClick={() => removeAt(zone, index)}>
          Remover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1300]"
      data-hive-pivot-root
      style={{ isolation: "isolate" }}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/50"
        aria-label="Fechar painel pivot"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 z-10 flex h-full min-h-0 w-[min(100vw,24rem)] flex-col border-l border-neutral-300 shadow-2xl",
          "text-neutral-900 dark:text-neutral-100"
        )}
        style={{
          /** Inline: o bundle do consumidor pode não incluir utilitários Tailwind arbitrários do pacote. */
          backgroundColor: "var(--ant-color-bg-container, var(--hive-grid-cell-default-bg, #ffffff))"
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hive-pivot-panel-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-inherit px-3 py-2 dark:border-neutral-700">
          <h2 id="hive-pivot-panel-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Pivô
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-gray-700 dark:text-gray-200"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-inherit p-3 text-sm">
          <div>
            <Input
              className="h-9 border border-neutral-300 bg-white text-sm text-neutral-900 shadow-sm dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="Campos de pesquisa"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Campos disponíveis</div>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-600 dark:bg-neutral-950">
              {filteredAvailable.length === 0 ? (
                <div className="px-2 py-2 text-xs text-gray-500">Nenhum campo</div>
              ) : (
                filteredAvailable.map((c) => (
                  <div
                    key={c.field}
                    className="flex items-center justify-between gap-1 rounded px-1 py-0.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{colLabel(c)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 px-2 text-xs">
                          +
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-[1200]">
                        <DropdownMenuItem onClick={() => addRow(c.field)}>Adicionar a Linhas</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addCol(c.field)}>Adicionar a Colunas</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addVal(c.field)}>Adicionar a Valores</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>

            <PivotSection
              title="Linhas"
              count={visibleCount("rows")}
              open={openRows}
              onToggle={() => setOpenRows((o) => !o)}
            >
              {draft.rows.map((def, i) => (
                <div
                  key={`r-${i}-${def.field}`}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1.5 shadow-sm dark:border-neutral-600 dark:bg-neutral-950"
                >
                  <Checkbox checked={def.hidden !== true} onCheckedChange={() => toggleHidden("rows", i)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-900 dark:text-neutral-100">
                    {colLabel(colByField(def.field) ?? ({ field: def.field } as GridColDef<R>))}
                  </span>
                  {isDateCol(colByField(def.field)) ? (
                    <select
                      className="h-7 max-w-[7rem] rounded-md border border-neutral-300 bg-white px-1 text-xs text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                      value={def.dateGranularity ?? "month"}
                      onChange={(e) => setDateGran("rows", i, e.target.value as GridPivotDateGranularity)}
                    >
                      {DATE_GRAN.map((x) => (
                        <option key={x.v} value={x.v}>
                          {x.l}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {zoneMenu("rows", i, draft.rows.length, def.field)}
                </div>
              ))}
            </PivotSection>

            <PivotSection
              title="Colunas"
              count={visibleCount("columns")}
              open={openCols}
              onToggle={() => setOpenCols((o) => !o)}
            >
              {draft.columns.map((def, i) => (
                <div
                  key={`c-${i}-${def.field}`}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1.5 shadow-sm dark:border-neutral-600 dark:bg-neutral-950"
                >
                  <Checkbox checked={def.hidden !== true} onCheckedChange={() => toggleHidden("columns", i)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-900 dark:text-neutral-100">
                    {colLabel(colByField(def.field) ?? ({ field: def.field } as GridColDef<R>))}
                  </span>
                  {isDateCol(colByField(def.field)) ? (
                    <select
                      className="h-7 max-w-[7rem] rounded-md border border-neutral-300 bg-white px-1 text-xs text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
                      value={def.dateGranularity ?? "month"}
                      onChange={(e) => setDateGran("columns", i, e.target.value as GridPivotDateGranularity)}
                    >
                      {DATE_GRAN.map((x) => (
                        <option key={x.v} value={x.v}>
                          {x.l}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {zoneMenu("columns", i, draft.columns.length, def.field)}
                </div>
              ))}
            </PivotSection>

            <PivotSection
              title="Valores"
              count={visibleCount("values")}
              open={openVals}
              onToggle={() => setOpenVals((o) => !o)}
            >
              {draft.values.map((def, i) => (
                <div
                  key={`v-${i}-${def.field}`}
                  className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1.5 shadow-sm dark:border-neutral-600 dark:bg-neutral-950"
                >
                  <Checkbox checked={def.hidden !== true} onCheckedChange={() => toggleHidden("values", i)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-900 dark:text-neutral-100">
                    {colLabel(colByField(def.field) ?? ({ field: def.field } as GridColDef<R>))}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 rounded-full border-neutral-300 bg-neutral-50 px-2.5 text-xs font-medium dark:border-neutral-500 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        {AGG_PT[def.aggFunc]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[1200]">
                      {aggChoicesForPivotValueField(colByField(def.field)).map((a) => (
                        <DropdownMenuItem key={a} onClick={() => setAgg(i, a)}>
                          {AGG_PT[a]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {zoneMenu("values", i, draft.values.length, def.field)}
                </div>
              ))}
            </PivotSection>
          </div>
        </div>

        <div className="mt-auto flex shrink-0 gap-2 border-t border-neutral-200 bg-inherit p-3 dark:border-neutral-700">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={reset}>
            Repor
          </Button>
          <Button type="button" size="sm" className="flex-1" disabled={!canApply} onClick={apply}>
            Aplicar
          </Button>
        </div>
      </aside>
    </div>,
    document.body
  );
}

function PivotSection(props: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-600 dark:bg-neutral-900">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 border-b border-neutral-200 bg-neutral-50 px-2.5 py-2 text-left dark:border-neutral-700 dark:bg-neutral-950"
        onClick={props.onToggle}
      >
        <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{props.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-xs font-medium tabular-nums text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
            {props.count}
          </span>
          {props.open ? (
            <ChevronDownIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" aria-hidden />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" aria-hidden />
          )}
        </span>
      </button>
      {props.open ? <div className="space-y-1.5 p-2">{props.children}</div> : null}
    </div>
  );
}

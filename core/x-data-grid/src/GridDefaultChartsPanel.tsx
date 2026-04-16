import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "../../../src/components/ui/dialog";
import { resolveSingleSelectDisplayLabel } from "./selectOptionLabel";
import type { GridChartsConfig, GridColDef, GridValidRowModel } from "./types";

type ChartPoint = { name: string; value: number };

function skipChartField(f: string): boolean {
  return f === "__select__" || f === "__detail__" || f === "__tree__" || f.startsWith("pivot_");
}

function isCategoryColumn<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  if (skipChartField(c.field)) return false;
  if (c.type === "actions" || c.getActions != null) return false;
  if (c.type === "number") return false;
  return true;
}

function isValueColumn<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  if (skipChartField(c.field)) return false;
  if (c.type === "actions" || c.getActions != null) return false;
  return c.type === "number";
}

function pickDefaultFields<R extends GridValidRowModel>(
  columns: GridColDef<R>[]
): { categoryField: string; valueField: string } | null {
  const cat = columns.find(isCategoryColumn)?.field ?? null;
  const val = columns.find(isValueColumn)?.field ?? null;
  if (!cat || !val) return null;
  return { categoryField: cat, valueField: val };
}

function buildPoints<R extends GridValidRowModel>(
  rows: R[],
  categoryField: string,
  valueField: string,
  columns: GridColDef<R>[]
): ChartPoint[] {
  if (!categoryField || !valueField) return [];
  const catCol = columns.find((c) => c.field === categoryField);
  /** Uma barra por categoria no eixo X: soma dos valores das linhas com o mesmo rótulo. */
  const byName = new Map<string, number>();
  for (const r of rows) {
    const o = r as Record<string, unknown>;
    const raw = o[categoryField];
    const name =
      catCol?.type === "singleSelect"
        ? resolveSingleSelectDisplayLabel(catCol, raw)
        : String(raw ?? "");
    const label = (name && String(name).trim()) || "—";
    const v = Number(o[valueField]);
    if (!Number.isFinite(v)) continue;
    byName.set(label, (byName.get(label) ?? 0) + v);
  }
  const out: ChartPoint[] = [...byName.entries()].map(([name, value]) => ({ name, value }));
  out.sort((a, b) => a.name.localeCompare(b.name, "pt", { sensitivity: "base" }));
  return out.slice(0, 200);
}

function colLabel<R extends GridValidRowModel>(c: GridColDef<R>): string {
  return (c.headerName ?? c.field).trim() || c.field;
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

  const defaults = React.useMemo(() => pickDefaultFields(columns), [columns]);
  const [categoryField, setCategoryField] = React.useState(() => config?.categoryField ?? defaults?.categoryField ?? "");
  const [valueField, setValueField] = React.useState(() => config?.valueField ?? defaults?.valueField ?? "");

  React.useEffect(() => {
    if (!open) return;
    const d = pickDefaultFields(columns);
    setCategoryField(config?.categoryField ?? d?.categoryField ?? "");
    setValueField(config?.valueField ?? d?.valueField ?? "");
  }, [open, config?.categoryField, config?.valueField, columns]);

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
  const valueColumns = React.useMemo(() => columns.filter(isValueColumn), [columns]);

  const data = React.useMemo(
    () => buildPoints(rows, categoryField, valueField, columns),
    [rows, categoryField, valueField, columns]
  );

  const selectCls =
    "mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 border-b border-gray-200 pb-3 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Escolha o campo categórico (eixo X) e o numérico (eixo Y). Os valores reflectem as linhas
            actualmente visíveis na grelha; categorias iguais no eixo X são somadas numa única barra.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-800 dark:text-gray-200">Categoria (eixo X)</label>
            <select
              className={selectCls}
              value={categoryField}
              onChange={(e) => setCategoryField(e.target.value)}
            >
              <option value="">—</option>
              {categoryColumns.map((c) => (
                <option key={c.field} value={c.field}>
                  {colLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-800 dark:text-gray-200">Valor (eixo Y)</label>
            <select className={selectCls} value={valueField} onChange={(e) => setValueField(e.target.value)}>
              <option value="">—</option>
              {valueColumns.map((c) => (
                <option key={c.field} value={c.field}>
                  {colLabel(c)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!Recharts ? (
          <p className="min-h-[3rem] text-sm text-gray-700 dark:text-gray-200">
            A instalar o motor de gráficos… Se o pacote `recharts` não estiver presente, adicione-o ao
            projecto.
          </p>
        ) : !categoryField || !valueField ? (
          <p className="min-h-[3rem] text-sm text-gray-700 dark:text-gray-200">
            Seleccione uma categoria e um valor numérico para desenhar o gráfico.
          </p>
        ) : data.length === 0 ? (
          <p className="min-h-[3rem] text-sm text-gray-700 dark:text-gray-200">
            Sem pontos numéricos para esta combinação. Experimente outros campos ou verifique os dados
            das linhas visíveis.
          </p>
        ) : (
          <div className="h-[280px] min-h-[200px] w-full min-w-0 text-gray-900 dark:text-gray-100">
            <Recharts.ResponsiveContainer width="100%" height="100%">
              <Recharts.BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <Recharts.XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#374151" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <Recharts.YAxis tick={{ fontSize: 11, fill: "#374151" }} width={40} />
                <Recharts.Tooltip />
                <Recharts.Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </Recharts.BarChart>
            </Recharts.ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

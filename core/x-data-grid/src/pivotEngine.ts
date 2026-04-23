import { pivotDimensionDisplayLabel, pivotDimensionKey, slugPivotKeyPart } from "./pivotDateGranularity";
import { normalizePivotModel } from "./pivotModelNormalize";
import { applyPivotAggToRawValues, sanitizePivotValueAggs } from "./pivotValueAggUtils";
import { resolveSingleSelectDisplayLabel } from "./selectOptionLabel";
import type {
  GridColDef,
  GridPivotAggFunc,
  GridPivotColumnDef,
  GridPivotModel,
  GridPivotRowDef,
  GridPivotValueDef,
  GridValidRowModel
} from "./types";

const ROW_SEP = "\x1e";

/** Exibição em PT: evita NaN na UI e alinha a casas decimais (ex.: 0,00). */
function formatPivotMetricCellPt(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0,00";
  return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fieldVal<R extends GridValidRowModel>(row: R, field: string): unknown {
  return (row as Record<string, unknown>)[field];
}

function colOf<R extends GridValidRowModel>(sourceColumns: GridColDef<R>[], field: string): GridColDef<R> | undefined {
  return sourceColumns.find((c) => c.field === field);
}

function formatAxisSegment<R extends GridValidRowModel>(
  segment: string,
  def: GridPivotRowDef | GridPivotColumnDef,
  sourceColumns: GridColDef<R>[]
): string {
  const cd = colOf(sourceColumns, def.field);
  if (cd?.type === "singleSelect") {
    return resolveSingleSelectDisplayLabel(cd, segment === "" ? null : segment);
  }
  return pivotDimensionDisplayLabel(segment, def, cd);
}

function aggLabelPt(agg: GridPivotAggFunc): string {
  switch (agg) {
    case "sum":
      return "soma";
    case "avg":
      return "média";
    case "min":
      return "mín";
    case "max":
      return "máx";
    case "count":
      return "contagem";
    case "countDistinct":
      return "contagem distinta";
    default:
      return agg;
  }
}

type ValSlot = { def: GridPivotValueDef; key: string };

type CellBucket = Map<string, unknown[]>;

/**
 * Pivot: múltiplas dimensões em linhas/colunas (chaves compostas) e várias métricas com agregação própria.
 */
export function computePivotView<R extends GridValidRowModel>(
  rows: R[],
  sourceColumns: GridColDef<R>[],
  model: GridPivotModel | undefined
): { rows: Record<string, unknown>[]; columns: GridColDef<R>[] } {
  const m = sanitizePivotValueAggs(normalizePivotModel(model ?? undefined), sourceColumns);
  const rowDefs = m.rows.filter((r) => !r.hidden);
  const colDefs = m.columns.filter((c) => !c.hidden);
  const valDefs = m.values.filter((v) => !v.hidden);

  if (rowDefs.length === 0 || colDefs.length === 0 || valDefs.length === 0) {
    return { rows: rows as unknown as Record<string, unknown>[], columns: sourceColumns };
  }

  const rowComposite = (r: R) => rowDefs.map((d) => pivotDimensionKey(r, d, colOf(sourceColumns, d.field))).join(ROW_SEP);
  const colComposite = (r: R) => colDefs.map((d) => pivotDimensionKey(r, d, colOf(sourceColumns, d.field))).join(ROW_SEP);

  const rowKeys = new Set<string>();
  const colKeys = new Set<string>();
  for (const r of rows) {
    rowKeys.add(rowComposite(r));
    colKeys.add(colComposite(r));
  }

  let rowOrder = [...rowKeys].sort();
  let colOrder = [...colKeys].sort();
  if (colDefs.length > 0 && colDefs[colDefs.length - 1]!.sort === "desc") {
    colOrder = [...colOrder].reverse();
  }

  const valSlots: ValSlot[] = valDefs.map((def) => ({
    def,
    key: `${def.field}\t${def.aggFunc}`
  }));

  const byRow = new Map<string, Map<string, CellBucket>>();
  for (const rk of rowOrder) {
    const inner = new Map<string, CellBucket>();
    for (const ck of colOrder) {
      const cell: CellBucket = new Map();
      for (const { key } of valSlots) cell.set(key, []);
      inner.set(ck, cell);
    }
    byRow.set(rk, inner);
  }

  for (const r of rows) {
    const rk = rowComposite(r);
    const ck = colComposite(r);
    const bucket = byRow.get(rk)?.get(ck);
    if (!bucket) continue;
    for (const { def, key } of valSlots) {
      const arr = bucket.get(key);
      if (!arr) continue;
      arr.push(fieldVal(r, def.field));
    }
  }

  const pivotRows: Record<string, unknown>[] = rowOrder.map((rk) => {
    const segs = rk.split(ROW_SEP);
    const labelParts = segs.map((seg, i) => formatAxisSegment(seg, rowDefs[i]!, sourceColumns));
    const out: Record<string, unknown> = {
      id: rk,
      pivot_row_label: labelParts.join(" · ")
    };
    const inner = byRow.get(rk)!;
    for (const ck of colOrder) {
      const cell = inner.get(ck)!;
      for (const { def, key } of valSlots) {
        const pivotField = `pivot_${slugPivotKeyPart(ck)}__${slugPivotKeyPart(def.field)}_${def.aggFunc}`;
        const raw = cell.get(key) ?? [];
        out[pivotField] = applyPivotAggToRawValues(raw, def.aggFunc);
      }
    }
    return out;
  });

  const rowHeader =
    rowDefs.map((d) => colOf(sourceColumns, d.field)?.headerName ?? d.field).join(" / ") || "Linhas";

  const rowGroupCol: GridColDef<R> = {
    field: "__pivot_row_group__",
    headerName: rowHeader,
    flex: 1,
    minWidth: 140,
    valueFormatter: (p) => String((p.row as Record<string, unknown>).pivot_row_label ?? "")
  };

  const pivotColumns: GridColDef<R>[] = [rowGroupCol, ...buildPivotColumnGroups(colOrder, colDefs, valSlots, sourceColumns)];

  return { rows: pivotRows, columns: pivotColumns };
}

type PivotTreeNode<R extends GridValidRowModel> = {
  key: string;
  label: string;
  subs: Map<string, PivotTreeNode<R>>;
  leaves: GridColDef<R>[];
};

function childColKeysInOrder(colOrder: string[], parentSegs: string[]): string[] {
  const depth = parentSegs.length;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const ck of colOrder) {
    const segs = ck.split(ROW_SEP);
    if (segs.length <= depth) continue;
    if (!parentSegs.every((p, i) => segs[i] === p)) continue;
    const next = segs[depth]!;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

function insertPivotTreeNode<R extends GridValidRowModel>(
  root: Map<string, PivotTreeNode<R>>,
  segs: string[],
  labels: string[],
  leaf: GridColDef<R>,
  depth: number
): void {
  const key = segs[depth]!;
  const label = labels[depth]!;
  let n = root.get(key);
  if (!n) {
    n = { key, label, subs: new Map(), leaves: [] };
    root.set(key, n);
  }
  if (depth === segs.length - 1) {
    n.leaves.push(leaf);
    return;
  }
  insertPivotTreeNode(n.subs, segs, labels, leaf, depth + 1);
}

function pivotTreeToColDef<R extends GridValidRowModel>(
  node: PivotTreeNode<R>,
  colOrder: string[],
  parentSegs: string[]
): GridColDef<R> {
  const pathKeys = [...parentSegs, node.key];
  const nextKeys = childColKeysInOrder(colOrder, pathKeys);
  const childrenOut: GridColDef<R>[] = [];
  for (const nk of nextKeys) {
    const ch = node.subs.get(nk);
    if (ch) childrenOut.push(pivotTreeToColDef(ch, colOrder, pathKeys));
  }
  if (node.leaves.length > 0) {
    childrenOut.push(...node.leaves);
  }
  const field = `__pivot_hg_${slugPivotKeyPart(pathKeys.join("__"))}`;
  return {
    field,
    headerName: node.label,
    sortable: false,
    filterable: false,
    resizable: false,
    disableReorder: true,
    disableColumnMenu: true,
    pinnable: false,
    hideable: false,
    children: childrenOut
  };
}

function buildPivotColumnGroups<R extends GridValidRowModel>(
  colOrder: string[],
  colDefs: GridPivotColumnDef[],
  valSlots: ValSlot[],
  sourceColumns: GridColDef<R>[]
): GridColDef<R>[] {
  const root = new Map<string, PivotTreeNode<R>>();
  for (const ck of colOrder) {
    const segs = ck.split(ROW_SEP);
    const labels = segs.map((seg, i) => formatAxisSegment(seg, colDefs[i]!, sourceColumns));
    for (const { def } of valSlots) {
      const cdVal = colOf(sourceColumns, def.field);
      const metricLabel = cdVal?.headerName ?? def.field;
      const pivotField = `pivot_${slugPivotKeyPart(ck)}__${slugPivotKeyPart(def.field)}_${def.aggFunc}`;
      const leaf: GridColDef<R> = {
        field: pivotField,
        headerName: metricLabel,
        pivotHeaderSecondary: aggLabelPt(def.aggFunc),
        type: "number",
        width: 130,
        minWidth: 88,
        valueFormatter: (p) => formatPivotMetricCellPt(p.value),
        disableReorder: true,
        disableColumnMenu: true,
        pinnable: false,
        hideable: false
      };
      insertPivotTreeNode(root, segs, labels, leaf, 0);
    }
  }
  const out: GridColDef<R>[] = [];
  for (const k of childColKeysInOrder(colOrder, [])) {
    const n = root.get(k);
    if (n) out.push(pivotTreeToColDef(n, colOrder, []));
  }
  return out;
}

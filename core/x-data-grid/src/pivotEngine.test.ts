import { describe, expect, it } from "vitest";
import type { GridColDef, GridPivotModel } from "./types";
import { computePivotView } from "./pivotEngine";
import { normalizePivotModel } from "./pivotModelNormalize";

type R = { id: number; region: string; product: string; sales: number };

describe("computePivotView", () => {
  it("agrega vendas por região × produto", () => {
    const rows: R[] = [
      { id: 1, region: "N", product: "A", sales: 10 },
      { id: 2, region: "N", product: "B", sales: 5 },
      { id: 3, region: "S", product: "A", sales: 20 }
    ];
    const cols: GridColDef<R>[] = [
      { field: "region", headerName: "R" },
      { field: "product", headerName: "P" },
      { field: "sales", headerName: "S", type: "number" }
    ];
    const model: GridPivotModel = {
      rows: [{ field: "region" }],
      columns: [{ field: "product" }],
      values: [{ field: "sales", aggFunc: "sum" }]
    };
    const { rows: out, columns: pc } = computePivotView(rows, cols, model);
    expect(pc.length).toBeGreaterThan(1);
    const n = out.find((r) => String((r as Record<string, unknown>).pivot_row_label).includes("N"));
    expect(n).toBeDefined();
    const row = n! as Record<string, unknown>;
    const pivotA = Object.keys(row).find((k) => k.includes("pivot_") && k.includes("sales"));
    expect(pivotA).toBeTruthy();
    expect(Number(row[pivotA!])).toBe(10);
  });

  it("cabeçalhos pivot para singleSelect usam label de valueOptions", () => {
    type Row = { id: number; agent: number; product: string; amount: number };
    const rows: Row[] = [
      { id: 1, agent: 10, product: "A", amount: 5 },
      { id: 2, agent: 20, product: "A", amount: 7 }
    ];
    const cols: GridColDef<Row>[] = [
      { field: "product", headerName: "Prod" },
      {
        field: "agent",
        headerName: "Agente",
        type: "singleSelect",
        valueOptions: [
          { value: 10, label: "Agente Dez" },
          { value: 20, label: "Agente Vinte" }
        ]
      },
      { field: "amount", type: "number", headerName: "Qtd" }
    ];
    const model: GridPivotModel = {
      rows: [{ field: "product" }],
      columns: [{ field: "agent" }],
      values: [{ field: "amount", aggFunc: "sum" }]
    };
    const { columns: pc } = computePivotView(rows, cols, model);
    const collectHeaderNames = (cols: typeof pc): string[] => {
      const out: string[] = [];
      for (const c of cols) {
        if (c.headerName) out.push(c.headerName);
        if (c.children?.length) out.push(...collectHeaderNames(c.children as typeof pc));
      }
      return out;
    };
    const names = collectHeaderNames(pc);
    expect(names.some((name) => name.includes("Agente Dez"))).toBe(true);
    expect(names.some((name) => name.includes("Agente Vinte"))).toBe(true);
  });

  it("várias métricas geram mais colunas pivot", () => {
    type Row = { id: number; g: string; a: number; b: number };
    const rows: Row[] = [
      { id: 1, g: "X", a: 1, b: 10 },
      { id: 2, g: "X", a: 2, b: 20 }
    ];
    const cols: GridColDef<Row>[] = [
      { field: "g", headerName: "G" },
      { field: "a", type: "number" },
      { field: "b", type: "number" }
    ];
    const model: GridPivotModel = {
      rows: [{ field: "g" }],
      columns: [{ field: "g" }],
      values: [
        { field: "a", aggFunc: "sum" },
        { field: "b", aggFunc: "avg" }
      ]
    };
    const { columns: pc } = computePivotView(rows, cols, model);
    const countPivotLeaves = (cols: typeof pc): number =>
      cols.reduce((n, c) => {
        if (c.field.startsWith("pivot_")) return n + 1;
        return n + (c.children?.length ? countPivotLeaves(c.children as typeof pc) : 0);
      }, 0);
    expect(countPivotLeaves(pc)).toBeGreaterThanOrEqual(2);
  });

  it("contagem e contagem distinta em campo texto", () => {
    type Row = { id: number; region: string; product: string };
    const rows: Row[] = [
      { id: 1, region: "N", product: "A" },
      { id: 2, region: "N", product: "A" },
      { id: 3, region: "S", product: "B" }
    ];
    const cols: GridColDef<Row>[] = [
      { field: "region", headerName: "R" },
      { field: "product", headerName: "P" },
      { field: "id", type: "number" }
    ];
    const countModel: GridPivotModel = {
      rows: [{ field: "region" }],
      columns: [{ field: "product" }],
      values: [{ field: "id", aggFunc: "count" }]
    };
    const { rows: outCount } = computePivotView(rows, cols, countModel);
    const nCell = outCount.find((r) => String((r as Record<string, unknown>).pivot_row_label).includes("N"));
    const pivotCountKey = Object.keys(nCell as object).find(
      (k) => k.startsWith("pivot_") && k.includes("__") && k.includes("id") && k.endsWith("_count")
    );
    expect(pivotCountKey).toBeTruthy();
    expect(Number((nCell as Record<string, unknown>)[pivotCountKey!])).toBe(2);

    const distinctModel: GridPivotModel = {
      rows: [{ field: "region" }],
      columns: [{ field: "product" }],
      values: [{ field: "product", aggFunc: "countDistinct" }]
    };
    const { rows: outD } = computePivotView(rows, cols, distinctModel);
    const rowN = outD.find((r) => String((r as Record<string, unknown>).pivot_row_label).includes("N"));
    const pivotDKey = Object.keys(rowN as object).find(
      (k) => k.startsWith("pivot_") && k.includes("__") && k.includes("countDistinct")
    );
    expect(Number((rowN as Record<string, unknown>)[pivotDKey!])).toBe(1);
  });

  it("intersecção pivot sem valores numéricos agrega soma como 0", () => {
    type Row = { region: string; product: string; sales: number };
    const rows: Row[] = [
      { region: "N", product: "A", sales: 10 },
      { region: "S", product: "B", sales: 20 }
    ];
    const cols: GridColDef<Row>[] = [
      { field: "region", headerName: "R" },
      { field: "product", headerName: "P" },
      { field: "sales", type: "number", headerName: "V" }
    ];
    const model: GridPivotModel = {
      rows: [{ field: "region" }],
      columns: [{ field: "product" }],
      values: [{ field: "sales", aggFunc: "sum" }]
    };
    const { rows: out } = computePivotView(rows, cols, model);
    const rowN = out.find((r) => String((r as Record<string, unknown>).pivot_row_label).includes("N"));
    expect(rowN).toBeDefined();
    const pivotBKey = Object.keys(rowN as object).find(
      (k) => k.startsWith("pivot_B__") && k.includes("sales") && k.endsWith("_sum")
    );
    expect(pivotBKey).toBeTruthy();
    expect(Number((rowN as Record<string, unknown>)[pivotBKey!])).toBe(0);
  });

  it("sum em campo não numérico é corrigido para contagem no motor", () => {
    type Row = { id: number; g: string };
    const rows: Row[] = [
      { id: 1, g: "X" },
      { id: 2, g: "X" }
    ];
    const cols: GridColDef<Row>[] = [
      { field: "g", headerName: "G" },
      { field: "id", type: "number" }
    ];
    const model: GridPivotModel = {
      rows: [{ field: "g" }],
      columns: [{ field: "g" }],
      values: [{ field: "g", aggFunc: "sum" }]
    };
    const { rows: out } = computePivotView(rows, cols, model);
    const k = Object.keys(out[0] as object).find(
      (x) => x.startsWith("pivot_") && x.includes("__") && x.endsWith("_count")
    );
    expect(k).toBeTruthy();
    expect(k).toContain("count");
    expect(Number((out[0] as Record<string, unknown>)[k!])).toBe(2);
  });

  it("normalizePivotModel aceita legado string[]", () => {
    const legacy = {
      rows: ["a"],
      columns: ["b"],
      values: [{ field: "c", aggFunc: "max" as const }]
    } as unknown as GridPivotModel;
    const n = normalizePivotModel(legacy);
    expect(n.rows).toEqual([{ field: "a" }]);
    expect(n.columns).toEqual([{ field: "b" }]);
    expect(n.values[0]?.aggFunc).toBe("max");
  });
});

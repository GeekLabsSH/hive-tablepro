import { describe, expect, it } from "vitest";
import type { Row } from "@tanstack/react-table";
import {
  applyGridFilterOperator,
  rowMatchesQuickSubstring,
  rowPassesFilterModel,
  sortFilterItemsByOrder,
  type HiveGlobalFilterBag
} from "./filterFns";
import type { GridColDef, GridFilterModel } from "./types";

describe("filterFns", () => {
  it("applyGridFilterOperator contains é case-insensitive", () => {
    expect(applyGridFilterOperator("Hello World", "contains", "world")).toBe(true);
    expect(applyGridFilterOperator("abc", "contains", "z")).toBe(false);
  });

  it("applyGridFilterOperator != em texto / enum", () => {
    expect(applyGridFilterOperator("ab", "!=", "cd")).toBe(true);
    expect(applyGridFilterOperator("ab", "!=", "ab")).toBe(false);
    expect(applyGridFilterOperator(1, "!=", 2)).toBe(true);
    expect(applyGridFilterOperator(1, "!=", 1)).toBe(false);
  });

  it("applyGridFilterOperator comparações numéricas", () => {
    expect(applyGridFilterOperator(10, ">", 5)).toBe(true);
    expect(applyGridFilterOperator(3, ">=", 3)).toBe(true);
    expect(applyGridFilterOperator(2, "<", 2)).toBe(false);
  });

  it("applyGridFilterOperator isEmpty / isNotEmpty", () => {
    expect(applyGridFilterOperator("", "isEmpty", null)).toBe(true);
    expect(applyGridFilterOperator("x", "isEmpty", null)).toBe(false);
    expect(applyGridFilterOperator("x", "isNotEmpty", null)).toBe(true);
  });

  it("applyGridFilterOperator inList", () => {
    expect(applyGridFilterOperator("b", "inList", "a;b;c")).toBe(true);
    expect(applyGridFilterOperator("x", "inList", "a;b")).toBe(false);
    expect(applyGridFilterOperator(2, "inList", "1;2;3")).toBe(true);
  });

  it("rowPassesFilterModel lista plana com joinWithPrevious por linha", () => {
    const row = {
      getValue: (f: string) => (f === "a" ? 1 : f === "b" ? 2 : 0)
    } as unknown as Row<Record<string, unknown>>;
    const model: GridFilterModel = {
      items: [
        { field: "a", operator: "=", value: 1 },
        { field: "b", operator: "=", value: 9, joinWithPrevious: "Or" }
      ],
      logicOperator: "And"
    };
    expect(rowPassesFilterModel(row, model)).toBe(true);
  });

  it("pesquisa rápida casa com rótulo de singleSelect (não só o valor bruto)", () => {
    const columnsByField = new Map<string, GridColDef<Record<string, unknown>>>();
    columnsByField.set("local", {
      field: "local",
      type: "singleSelect",
      valueOptions: [
        { value: 1, label: "Frete" },
        { value: 2, label: "Origem" }
      ]
    });
    const original = { id: "r1", local: 1 };
    const shell = {
      id: "r1",
      original,
      getVisibleCells: (): unknown[] => []
    };
    const cells = [
      {
        column: { id: "local" },
        row: shell,
        getValue: () => 1
      }
    ];
    shell.getVisibleCells = () => cells;
    const row = shell as unknown as Row<Record<string, unknown>>;
    const bag: HiveGlobalFilterBag<Record<string, unknown>> = {
      __hive: true,
      quickTyped: "",
      filterModel: { items: [] },
      disableQuick: false,
      columnsByField
    };
    expect(rowMatchesQuickSubstring(row, "Frete", bag)).toBe(true);
    expect(rowMatchesQuickSubstring(row, "frete", bag)).toBe(true);
    expect(rowMatchesQuickSubstring(row, "1", bag)).toBe(true);
    expect(rowMatchesQuickSubstring(row, "Origem", bag)).toBe(false);
  });

  it("pesquisa rápida usa valueFormatter quando existir", () => {
    const columnsByField = new Map<string, GridColDef<Record<string, unknown>>>();
    columnsByField.set("code", {
      field: "code",
      type: "string",
      valueFormatter: () => "Etiqueta visível"
    });
    const original = { id: "r1", code: "X9" };
    const shell = { id: "r1", original, getVisibleCells: (): unknown[] => [] };
    const cells = [
      {
        column: { id: "code" },
        row: shell,
        getValue: () => "X9"
      }
    ];
    shell.getVisibleCells = () => cells;
    const row = shell as unknown as Row<Record<string, unknown>>;
    const bag: HiveGlobalFilterBag<Record<string, unknown>> = {
      __hive: true,
      quickTyped: "",
      filterModel: { items: [] },
      disableQuick: false,
      columnsByField
    };
    expect(rowMatchesQuickSubstring(row, "Etiqueta", bag)).toBe(true);
    expect(rowMatchesQuickSubstring(row, "inexistente", bag)).toBe(false);
  });

  it("sortFilterItemsByOrder ordena por filterOrder com empate na ordem do array", () => {
    const items = [
      { field: "b", operator: "=" as const, value: 1, filterOrder: 2 },
      { field: "a", operator: "=" as const, value: 1, filterOrder: 1 }
    ];
    const s = sortFilterItemsByOrder(items);
    expect(s.map((x) => x.field)).toEqual(["a", "b"]);
  });

  it("rowPassesFilterModel grupos e groupLogicOperator", () => {
    const row = {
      getValue: (f: string) => (f === "a" ? 1 : f === "b" ? 5 : 0)
    } as unknown as Row<Record<string, unknown>>;
    const model: GridFilterModel = {
      items: [
        { field: "a", operator: "=", value: 1, groupId: 1 },
        { field: "b", operator: "<", value: 3, groupId: 1, groupItemLogic: "Or" },
        { field: "b", operator: ">", value: 0, groupId: 2 }
      ],
      groupLogicOperator: "And"
    };
    expect(rowPassesFilterModel(row, model)).toBe(true);
  });
});

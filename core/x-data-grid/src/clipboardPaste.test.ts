import { describe, expect, it } from "vitest";
import {
  buildClipboardPastePlan,
  coercePasteTextForColumn,
  parseClipboardTsv
} from "./clipboardPaste";
import type { GridColDef } from "./types";

describe("parseClipboardTsv", () => {
  it("divide por linhas e tabulações", () => {
    expect(parseClipboardTsv("a\tb\nc\td")).toEqual([
      ["a", "b"],
      ["c", "d"]
    ]);
  });

  it("normaliza CRLF e remove linha final vazia", () => {
    expect(parseClipboardTsv("x\t1\r\ny\t2\r\n")).toEqual([
      ["x", "1"],
      ["y", "2"]
    ]);
  });
});

describe("coercePasteTextForColumn", () => {
  it("número e boolean", () => {
    const n: GridColDef = { field: "n", type: "number", editable: true };
    expect(coercePasteTextForColumn(n, "3.5")).toBe(3.5);
    const b: GridColDef = { field: "b", type: "boolean", editable: true };
    expect(coercePasteTextForColumn(b, "true")).toBe(true);
    expect(coercePasteTextForColumn(b, "false")).toBe(false);
  });
});

describe("buildClipboardPastePlan", () => {
  it("preenche a partir da célula inicial", () => {
    const columnsByField = new Map<string, GridColDef>([
      ["a", { field: "a", type: "string", editable: true }],
      ["b", { field: "b", type: "string", editable: true }]
    ]);
    const rows = [
      {
        id: "r0",
        getIsGrouped: () => false,
        original: { id: 1, a: "", b: "" }
      },
      {
        id: "r1",
        getIsGrouped: () => false,
        original: { id: 2, a: "", b: "" }
      }
    ];
    const plan = buildClipboardPastePlan({
      matrix: [
        ["x", "y"],
        ["p", "q"]
      ],
      tableRows: rows as never,
      visibleFields: ["a", "b"],
      columnsByField: columnsByField as never,
      startRowIndex: 0,
      startColIndex: 0,
      getRowId: (r) => (r as { id: number }).id
    });
    expect(plan?.updates).toHaveLength(2);
    expect(plan?.updates[0]).toMatchObject({ id: 1, a: "x", b: "y" });
    expect(plan?.updates[1]).toMatchObject({ id: 2, a: "p", b: "q" });
  });
});

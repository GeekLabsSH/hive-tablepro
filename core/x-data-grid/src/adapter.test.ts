import { describe, expect, it } from "vitest";
import { buildColumnDefs, defaultGetRowId } from "./adapter";

describe("adapter", () => {
  it("defaultGetRowId prefere id, depois key, senão JSON", () => {
    expect(defaultGetRowId({ id: 5, key: "x" })).toBe(5);
    expect(defaultGetRowId({ key: "x" })).toBe("x");
    expect(defaultGetRowId({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
  });

  it("buildColumnDefs usa width como size (clamp)", () => {
    const apiRef = { current: null };
    const defs = buildColumnDefs([{ field: "a", headerName: "A", width: 99 }], {
      apiRef,
      getRowId: defaultGetRowId
    });
    expect(defs[0].size).toBe(99);
  });

  it("buildColumnDefs mapeia flex para size proporcional dentro de min/max", () => {
    const apiRef = { current: null };
    const defs = buildColumnDefs(
      [{ field: "b", flex: 2, minWidth: 80, maxWidth: 500 }],
      { apiRef, getRowId: defaultGetRowId }
    );
    expect(defs[0].size).toBe(200);
  });
});

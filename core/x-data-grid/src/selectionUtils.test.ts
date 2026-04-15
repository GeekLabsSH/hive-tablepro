import { describe, expect, it } from "vitest";
import {
  isGlobalSelectAllExclude,
  normalizeSelectionIds,
  rowSelectionModelFromState,
  rowSelectionStateFromModel,
  selectionModelType
} from "./selectionUtils";

describe("selectionUtils", () => {
  it("normalizeSelectionIds devolve cópia vazia quando não há modelo", () => {
    expect(normalizeSelectionIds(undefined)).toEqual([]);
  });

  it("selectionModelType assume include por omissão", () => {
    expect(selectionModelType(undefined)).toBe("include");
    expect(selectionModelType({ type: "include", ids: [] })).toBe("include");
    expect(selectionModelType({ type: "exclude", ids: [] })).toBe("exclude");
  });

  it("rowSelectionStateFromModel em modo include marca só ids listados", () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const state = rowSelectionStateFromModel(
      { type: "include", ids: [1] },
      rows,
      (r) => r.id
    );
    expect(state["1"]).toBe(true);
    expect(state["2"]).toBeUndefined();
  });

  it("rowSelectionModelFromState em include funde página com ids fora da página", () => {
    const pageRows = [{ id: 2 }];
    const next = { "2": true as const };
    const model = rowSelectionModelFromState(
      next,
      pageRows,
      (r) => r.id,
      "include",
      { type: "include", ids: [1] }
    );
    expect(model.type).toBe("include");
    const ids = normalizeSelectionIds(model);
    expect(new Set(ids.map(String))).toEqual(new Set(["1", "2"]));
  });

  it("isGlobalSelectAllExclude só quando exclude sem ids", () => {
    expect(isGlobalSelectAllExclude({ type: "exclude", ids: [] })).toBe(true);
    expect(isGlobalSelectAllExclude({ type: "exclude", ids: [1] })).toBe(false);
    expect(isGlobalSelectAllExclude({ type: "include", ids: [] })).toBe(false);
  });
});

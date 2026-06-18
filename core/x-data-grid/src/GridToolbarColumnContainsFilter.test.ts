import { describe, expect, it } from "vitest";
import { upsertColumnContainsFilter } from "./GridToolbarColumnContainsFilter";
import type { GridFilterModel } from "./types";

describe("upsertColumnContainsFilter", () => {
  it("adiciona item contains e limpa quickFilterValues", () => {
    const model: GridFilterModel = {
      items: [],
      quickFilterValues: ["foo"]
    };
    const next = upsertColumnContainsFilter(model, "name", "  bar  ");
    expect(next.quickFilterValues).toBeUndefined();
    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toMatchObject({
      field: "name",
      operator: "contains",
      value: "bar"
    });
    expect(next.items[0].id).toBeTruthy();
  });

  it("substitui item existente com o mesmo field", () => {
    const model: GridFilterModel = {
      items: [
        { id: "a", field: "name", operator: "contains", value: "old" },
        { id: "b", field: "code", operator: "=", value: "1" }
      ]
    };
    const next = upsertColumnContainsFilter(model, "name", "new");
    expect(next.items).toHaveLength(2);
    expect(next.items.find((i) => i.field === "name")).toMatchObject({
      operator: "contains",
      value: "new"
    });
    expect(next.items.find((i) => i.field === "name")?.id).not.toBe("a");
    expect(next.items.find((i) => i.field === "code")).toMatchObject({ id: "b", value: "1" });
  });

  it("remove item quando valor trimado é vazio", () => {
    const model: GridFilterModel = {
      items: [{ id: "a", field: "name", operator: "contains", value: "x" }],
      quickFilterValues: ["q"]
    };
    const next = upsertColumnContainsFilter(model, "name", "   ");
    expect(next.items).toHaveLength(0);
    expect(next.quickFilterValues).toBeUndefined();
  });
});

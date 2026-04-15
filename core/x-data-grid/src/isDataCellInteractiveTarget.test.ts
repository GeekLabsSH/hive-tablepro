import { describe, expect, it } from "vitest";
import { isDataCellInteractiveTarget } from "./isDataCellInteractiveTarget";

describe("isDataCellInteractiveTarget", () => {
  it("null / não-HTMLElement é false", () => {
    expect(isDataCellInteractiveTarget(null)).toBe(false);
    expect(isDataCellInteractiveTarget({} as EventTarget)).toBe(false);
  });

  it("com DOM: botão conta como interativo", () => {
    if (typeof document === "undefined") return;
    const btn = document.createElement("button");
    expect(isDataCellInteractiveTarget(btn)).toBe(true);
    const span = document.createElement("span");
    expect(isDataCellInteractiveTarget(span)).toBe(false);
  });
});

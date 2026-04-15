import { describe, expect, it } from "vitest";
import { applyGridFilterOperator } from "./filterFns";

describe("filterFns", () => {
  it("applyGridFilterOperator contains é case-insensitive", () => {
    expect(applyGridFilterOperator("Hello World", "contains", "world")).toBe(true);
    expect(applyGridFilterOperator("abc", "contains", "z")).toBe(false);
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
});

import { describe, expect, it } from "vitest";
import { parseFlexibleNumber } from "./flexibleNumberParse";

describe("parseFlexibleNumber", () => {
  it("parses plain numbers", () => {
    expect(parseFlexibleNumber(42)).toBe(42);
    expect(parseFlexibleNumber("0")).toBe(0);
    expect(parseFlexibleNumber("-12.5")).toBe(-12.5);
  });

  it("parses PT-style 1.400,00", () => {
    expect(parseFlexibleNumber("1.400,00")).toBe(1400);
    expect(parseFlexibleNumber(" 1.234,56 ")).toBeCloseTo(1234.56);
  });

  it("parses US-style 1,400.00", () => {
    expect(parseFlexibleNumber("1,400.00")).toBe(1400);
    expect(parseFlexibleNumber("1,234.56")).toBeCloseTo(1234.56);
  });

  it("parses apostrophe thousands 1'400,00", () => {
    expect(parseFlexibleNumber("1'400,00")).toBe(1400);
  });

  it("returns NaN for empty or invalid", () => {
    expect(Number.isNaN(parseFlexibleNumber(""))).toBe(true);
    expect(Number.isNaN(parseFlexibleNumber("abc"))).toBe(true);
  });
});

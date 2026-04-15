import { describe, expect, it } from "vitest";
import { announceTextForFilterModel, announceTextForSortModel } from "./gridAnnouncements";
import type { GridColDef, GridLocaleText } from "./types";

const lt = (_k: keyof GridLocaleText, fallback: string) => fallback;

describe("gridAnnouncements", () => {
  it("announceTextForSortModel sem critérios", () => {
    expect(announceTextForSortModel([], [], lt)).toMatch(/removida/i);
  });

  it("announceTextForSortModel com colunas", () => {
    const cols: GridColDef<{ id: number }>[] = [
      { field: "name", headerName: "Nome", width: 100 },
      { field: "amount", headerName: "Valor", width: 80 }
    ];
    expect(announceTextForSortModel([{ field: "name", sort: "asc" }], cols, lt)).toContain("Nome");
    expect(announceTextForSortModel([{ field: "name", sort: "asc" }], cols, lt)).toMatch(/crescente/i);
    expect(announceTextForSortModel([{ field: "amount", sort: "desc" }], cols, lt)).toMatch(/decrescente/i);
  });

  it("announceTextForFilterModel vazio vs ativo", () => {
    expect(announceTextForFilterModel({ items: [] }, lt)).toMatch(/removidos/i);
    expect(
      announceTextForFilterModel({ items: [{ field: "a", operator: "contains", value: "x" }] }, lt)
    ).toMatch(/1/);
    expect(
      announceTextForFilterModel({ items: [], quickFilterValues: ["hi"] }, lt)
    ).toMatch(/1/);
  });
});

import { describe, expect, it } from "vitest";
import {
  GRID_PREFERENCES_STORAGE_VERSION,
  mergePersistedColumnOrder,
  mergePersistedColumnSizing,
  parsePersistedGridPreferences,
  pickPersistableColumnSizing,
  readGridPreferencesFromStorage,
  stringifyPersistedGridPreferences,
  writeGridPreferencesToStorage
} from "./persistGridPreferences";

describe("persistGridPreferences", () => {
  it("parsePersistedGridPreferences rejeita versão errada", () => {
    expect(parsePersistedGridPreferences(JSON.stringify({ v: 999 }))).toBeNull();
    expect(parsePersistedGridPreferences("not json")).toBeNull();
  });

  it("stringify + parse roundtrip", () => {
    const json = stringifyPersistedGridPreferences({
      sortModel: [{ field: "nome", sort: "asc" }]
    });
    const parsed = parsePersistedGridPreferences(json);
    expect(parsed?.v).toBe(GRID_PREFERENCES_STORAGE_VERSION);
    expect(parsed?.sortModel).toEqual([{ field: "nome", sort: "asc" }]);
  });

  it("readGridPreferencesFromStorage usa storage injectado", () => {
    const storage: Storage = {
      getItem: (key) =>
        key === "grid:prefs"
          ? stringifyPersistedGridPreferences({ filterModel: { items: [], logicOperator: "And" } })
          : null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
    const read = readGridPreferencesFromStorage("grid:prefs", storage);
    expect(read?.filterModel?.logicOperator).toBe("And");
  });

  it("pickPersistableColumnSizing ignora meta e valores inválidos", () => {
    expect(
      pickPersistableColumnSizing({
        name: 200,
        __select__: 99,
        bad: 3,
        x: Number.NaN
      })
    ).toEqual({ name: 200 });
  });

  it("mergePersistedColumnSizing só aplica ids válidos", () => {
    const base = ["__select__", "a", "b"];
    expect(mergePersistedColumnSizing(base, { a: 120, z: 400 })).toEqual({ a: 120 });
  });

  it("mergePersistedColumnOrder preserva ordem guardada e acrescenta colunas novas", () => {
    const base = ["__select__", "a", "b", "c"];
    expect(mergePersistedColumnOrder(base, ["c", "a"])).toEqual(["c", "a", "__select__", "b"]);
    expect(mergePersistedColumnOrder(base, undefined)).toEqual(base);
  });

  it("stringify + parse com columnOrder, rowGroupingModel e columnSizing", () => {
    const json = stringifyPersistedGridPreferences({
      columnOrder: ["id", "name"],
      rowGroupingModel: ["name"],
      columnSizing: { id: 80, name: 240 }
    });
    const parsed = parsePersistedGridPreferences(json);
    expect(parsed?.columnOrder).toEqual(["id", "name"]);
    expect(parsed?.rowGroupingModel).toEqual(["name"]);
    expect(parsed?.columnSizing).toEqual({ id: 80, name: 240 });
  });

  it("writeGridPreferencesToStorage grava JSON válido", () => {
    let stored: string | null = null;
    const storage: Storage = {
      getItem: (k) => (k === "k" ? stored : null),
      setItem: (k, v) => {
        stored = v;
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
    writeGridPreferencesToStorage("k", { paginationModel: { page: 1, pageSize: 50 } }, storage);
    expect(parsePersistedGridPreferences(stored!)?.paginationModel).toEqual({
      page: 1,
      pageSize: 50
    });
  });
});

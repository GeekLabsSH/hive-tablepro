import type { GridCellParams, GridValidRowModel } from "./types";

/**
 * Comparador MUI X para ordenação cliente (strings com `localeCompare` numérico; números por diferença).
 * Ignora `param1`/`param2` se não forem passados.
 */
export function gridStringOrNumberComparator<R extends GridValidRowModel = GridValidRowModel, V = unknown>(
  v1: V,
  v2: V,
  _param1?: GridCellParams<R, V>,
  _param2?: GridCellParams<R, V>
): number {
  if (v1 == null && v2 == null) return 0;
  if (v1 == null) return -1;
  if (v2 == null) return 1;
  if (typeof v1 === "number" && typeof v2 === "number" && Number.isFinite(v1) && Number.isFinite(v2)) {
    return v1 - v2;
  }
  return String(v1).localeCompare(String(v2), undefined, { numeric: true, sensitivity: "base" });
}

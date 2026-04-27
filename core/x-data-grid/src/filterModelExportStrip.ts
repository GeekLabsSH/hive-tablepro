import type { GridColDef, GridFilterModel, GridValidRowModel } from "./types";

/**
 * Remove entradas de `filterModel.items` cujo `field` está marcado com `excludeFromFilterExport` na definição de colunas.
 */
export function stripFilterModelForExport<R extends GridValidRowModel>(
  model: GridFilterModel,
  columns: GridColDef<R>[]
): GridFilterModel {
  const excluded = new Set(columns.filter((c) => c.excludeFromFilterExport).map((c) => c.field));
  const items = (model.items ?? []).filter((it) => !excluded.has(it.field));
  return { ...model, items };
}

import type { GridColDef, GridPivotAggFunc, GridPivotModel, GridValidRowModel } from "./types";

export function skipPivotLayoutField(f: string): boolean {
  return f === "__select__" || f === "__detail__" || f === "__tree__" || f.startsWith("pivot_");
}

/** Campos que podem ir a Linhas/Colunas/Valores (excepto acções e meta). */
export function isPivotAxisCandidate<R extends GridValidRowModel>(c: GridColDef<R>): boolean {
  if (c.hide === true) return false;
  if (skipPivotLayoutField(c.field)) return false;
  if (c.type === "actions" || c.getActions != null) return false;
  return true;
}

/** Qualquer eixo pode ser métrica com contagem / contagem distinta; numéricos também soma, média, etc. */
export function canAddFieldToPivotValues<R extends GridValidRowModel>(c: GridColDef<R> | undefined): boolean {
  return !!c && isPivotAxisCandidate(c);
}

export function defaultAggForPivotValueField<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined
): GridPivotAggFunc {
  if (cd?.type === "number") return "sum";
  return "count";
}

export function aggChoicesForPivotValueField<R extends GridValidRowModel>(
  cd: GridColDef<R> | undefined
): GridPivotAggFunc[] {
  if (cd?.type === "number") return ["sum", "avg", "min", "max", "count", "countDistinct"];
  return ["count", "countDistinct"];
}

export function sanitizePivotValueAggs<R extends GridValidRowModel>(
  model: GridPivotModel,
  sourceColumns: GridColDef<R>[]
): GridPivotModel {
  const colBy = new Map(sourceColumns.map((c) => [c.field, c]));
  return {
    ...model,
    values: model.values.map((v) => {
      const cd = colBy.get(v.field);
      const allowed = aggChoicesForPivotValueField(cd);
      if (allowed.includes(v.aggFunc)) return v;
      return { ...v, aggFunc: defaultAggForPivotValueField(cd) };
    })
  };
}

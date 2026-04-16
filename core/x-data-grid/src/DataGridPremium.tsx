import * as React from "react";
import type { DataGridProps } from "./dataGridProps";
import { DataGrid } from "./DataGrid";
import type { GridValidRowModel } from "./types";

/**
 * Variante Premium da grelha Hive: mesmas props que `DataGrid`, com contrato alinhado ao MUI X Data Grid Premium
 * (pivotagem, gráficos, painéis opcionais). A implementação vive no core `DataGrid`.
 */
export function DataGridPremium<R extends GridValidRowModel = GridValidRowModel>(
  props: DataGridProps<R>
) {
  return <DataGrid<R> {...props} />;
}

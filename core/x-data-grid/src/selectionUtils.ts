import type { RowSelectionState } from "@tanstack/react-table";
import type { GridRowId, GridRowSelectionModel, GridValidRowModel } from "./types";

export function normalizeSelectionIds(model?: GridRowSelectionModel): GridRowId[] {
  if (!model?.ids) return [];
  return Array.isArray(model.ids) ? [...model.ids] : [...model.ids];
}

export function selectionModelType(model?: GridRowSelectionModel): "include" | "exclude" {
  return model?.type === "exclude" ? "exclude" : "include";
}

/** Converte `GridRowSelectionModel` para estado TanStack (`true` = linha selecionada). */
export function rowSelectionStateFromModel<R extends GridValidRowModel>(
  model: GridRowSelectionModel | undefined,
  dataRows: R[],
  getRowId: (row: R) => GridRowId,
  isRowSelectable?: (params: { id: GridRowId; row: R }) => boolean
): RowSelectionState {
  const type = selectionModelType(model);
  const rawIds = normalizeSelectionIds(model);
  const idSet = new Set(rawIds.map(String));

  const o: RowSelectionState = {};
  for (const row of dataRows) {
    const id = String(getRowId(row));
    const selectable = isRowSelectable ? isRowSelectable({ id, row }) : true;
    if (!selectable) continue;
    if (type === "include") {
      if (idSet.has(id)) o[id] = true;
    } else {
      if (!idSet.has(id)) o[id] = true;
    }
  }
  return o;
}

/**
 * Constrói o modelo a partir do estado TanStack após interação.
 * Em modo `exclude`, funde com o modelo anterior para ids fora da página atual.
 */
export function rowSelectionModelFromState<R extends GridValidRowModel>(
  next: RowSelectionState,
  pageRows: R[],
  getRowId: (row: R) => GridRowId,
  type: "include" | "exclude",
  prevModel: GridRowSelectionModel | undefined,
  isRowSelectable?: (params: { id: GridRowId; row: R }) => boolean
): GridRowSelectionModel {
  const pageSelectable = pageRows.filter((row) => {
    const id = getRowId(row);
    return isRowSelectable ? isRowSelectable({ id, row }) : true;
  });

  if (type === "include") {
    const pageIdSet = new Set(pageSelectable.map((r) => String(getRowId(r))));
    const fromPage: GridRowId[] = [];
    for (const row of pageSelectable) {
      const id = getRowId(row);
      if (next[String(id)]) fromPage.push(id);
    }
    const rest: GridRowId[] = [];
    if (prevModel && selectionModelType(prevModel) === "include") {
      for (const pid of normalizeSelectionIds(prevModel)) {
        if (!pageIdSet.has(String(pid))) rest.push(pid);
      }
    }
    return { type: "include", ids: [...rest, ...fromPage] };
  }

  const prevExclude = new Set(
    prevModel && selectionModelType(prevModel) === "exclude"
      ? normalizeSelectionIds(prevModel).map(String)
      : []
  );
  for (const row of pageSelectable) {
    const id = String(getRowId(row));
    if (next[id]) prevExclude.delete(id);
    else prevExclude.add(id);
  }
  const ids = [...prevExclude].map((s) => {
    const n = Number(s);
    return Number.isFinite(n) && String(n) === s ? n : s;
  }) as GridRowId[];
  return { type: "exclude", ids };
}

/** Todas as linhas do conjunto estão selecionadas (modelo exclude sem ids excluídos). */
export function isGlobalSelectAllExclude(model?: GridRowSelectionModel): boolean {
  return selectionModelType(model) === "exclude" && normalizeSelectionIds(model).length === 0;
}

/** Número de linhas selecionadas para o rodapé (controlado) ou null para usar contagem TanStack. */
export function selectedRowCountForFooter(
  model: GridRowSelectionModel | undefined,
  rowCount: number | undefined | null
): number | null {
  if (!model) return null;
  if (selectionModelType(model) === "exclude") {
    const ex = normalizeSelectionIds(model).length;
    if (rowCount != null && rowCount >= 0) return Math.max(0, rowCount - ex);
    return null;
  }
  return normalizeSelectionIds(model).length;
}

import {
  columnGroupsStateInitializer,
  columnMenuStateInitializer,
  columnsStateInitializer,
  densityStateInitializer,
  editingStateInitializer,
  filterStateInitializer,
  focusStateInitializer,
  paginationStateInitializer,
  preferencePanelStateInitializer,
  rowSelectionStateInitializer,
  rowsMetaStateInitializer,
  rowsStateInitializer,
  sortingStateInitializer,
  useGridClipboard,
  useGridColumnGrouping,
  useGridColumnMenu,
  useGridColumns,
  useGridColumnSpanning,
  useGridCsvExport,
  useGridDensity,
  useGridDimensions,
  useGridEditing,
  useGridEvents,
  useGridFilter,
  useGridFocus,
  useGridInitialization,
  useGridInitializeState,
  useGridKeyboardNavigation,
  useGridPagination,
  useGridParamsApi,
  useGridPreferencesPanel,
  useGridPrintExport,
  useGridRows,
  useGridRowSelection,
  useGridRowsMeta,
  useGridRowsPreProcessors,
  useGridScroll,
  useGridSorting,
  useGridStatePersistence,
} from "@GeekLabsSH/hive-tablepro/core/x-data-grid/src/internals";
import * as React from "react";
import { DataGridProProcessedProps } from "../models/dataGridProProps";
import { GridApiPro, GridPrivateApiPro } from "../models/gridApiPro";
// Pro-only features
import {
  columnPinningStateInitializer,
  useGridColumnPinning,
} from "../hooks/features/columnPinning/useGridColumnPinning";
import { useGridColumnPinningPreProcessors } from "../hooks/features/columnPinning/useGridColumnPinningPreProcessors";
import {
  columnReorderStateInitializer,
  useGridColumnReorder,
} from "../hooks/features/columnReorder/useGridColumnReorder";
import {
  columnResizeStateInitializer,
  useGridColumnResize,
} from "../hooks/features/columnResize/useGridColumnResize";
import {
  detailPanelStateInitializer,
  useGridDetailPanel,
} from "../hooks/features/detailPanel/useGridDetailPanel";
import { useGridDetailPanelPreProcessors } from "../hooks/features/detailPanel/useGridDetailPanelPreProcessors";
import { useGridInfiniteLoader } from "../hooks/features/infiniteLoader/useGridInfiniteLoader";
import { useGridLazyLoader } from "../hooks/features/lazyLoader/useGridLazyLoader";
import { useGridLazyLoaderPreProcessors } from "../hooks/features/lazyLoader/useGridLazyLoaderPreProcessors";
import {
  rowPinningStateInitializer,
  useGridRowPinning,
} from "../hooks/features/rowPinning/useGridRowPinning";
import { useGridRowPinningPreProcessors } from "../hooks/features/rowPinning/useGridRowPinningPreProcessors";
import { useGridRowReorder } from "../hooks/features/rowReorder/useGridRowReorder";
import { useGridRowReorderPreProcessors } from "../hooks/features/rowReorder/useGridRowReorderPreProcessors";
import { useGridTreeData } from "../hooks/features/treeData/useGridTreeData";
import { useGridTreeDataPreProcessors } from "../hooks/features/treeData/useGridTreeDataPreProcessors";
import { useGridExcelExport } from "../../../x-data-grid/src/hooks/features/export/useGridExcelExport";

export const useDataGridProComponent = (
  inputApiRef: React.MutableRefObject<GridApiPro> | undefined,
  props: DataGridProProcessedProps
) => {
  const apiRef = useGridInitialization<GridPrivateApiPro, GridApiPro>(
    inputApiRef,
    props
  );

  /**
   * Register all pre-processors called during state initialization here.
   */
  //useGridRowSelectionPreProcessors(apiRef, props);
  useGridRowReorderPreProcessors(apiRef, props);
  useGridTreeDataPreProcessors(apiRef, props);
  useGridLazyLoaderPreProcessors(apiRef, props);
  useGridRowPinningPreProcessors(apiRef);
  useGridDetailPanelPreProcessors(apiRef, props);
  // The column pinning `hydrateColumns` pre-processor must be after every other `hydrateColumns` pre-processors
  // Because it changes the order of the columns.
  useGridColumnPinningPreProcessors(apiRef, props);
  useGridRowsPreProcessors(apiRef);

  /**
   * Register all state initializers here.
   */
  useGridInitializeState(rowSelectionStateInitializer, apiRef, props);
  useGridInitializeState(detailPanelStateInitializer, apiRef, props);
  useGridInitializeState(columnPinningStateInitializer, apiRef, props);
  useGridInitializeState(columnsStateInitializer, apiRef, props);
  useGridInitializeState(rowPinningStateInitializer, apiRef, props);
  useGridInitializeState(rowsStateInitializer, apiRef, props);
  useGridInitializeState(editingStateInitializer, apiRef, props);
  useGridInitializeState(focusStateInitializer, apiRef, props);
  useGridInitializeState(sortingStateInitializer, apiRef, props);
  useGridInitializeState(preferencePanelStateInitializer, apiRef, props);
  useGridInitializeState(filterStateInitializer, apiRef, props);
  useGridInitializeState(densityStateInitializer, apiRef, props);
  useGridInitializeState(columnReorderStateInitializer, apiRef, props);
  useGridInitializeState(columnResizeStateInitializer, apiRef, props);
  useGridInitializeState(paginationStateInitializer, apiRef, props);
  useGridInitializeState(rowsMetaStateInitializer, apiRef, props);
  useGridInitializeState(columnMenuStateInitializer, apiRef, props);
  useGridInitializeState(columnGroupsStateInitializer, apiRef, props);

  useGridTreeData(apiRef);
  useGridKeyboardNavigation(apiRef, props);
  useGridRowSelection(apiRef, props);
  useGridColumnPinning(apiRef, props);
  useGridRowPinning(apiRef, props);
  useGridColumns(apiRef, props);
  useGridRows(apiRef, props);
  useGridParamsApi(apiRef);
  useGridDetailPanel(apiRef, props);
  useGridColumnSpanning(apiRef);
  useGridColumnGrouping(apiRef, props);
  useGridEditing(apiRef, props);
  useGridFocus(apiRef, props);
  useGridPreferencesPanel(apiRef, props);
  useGridFilter(apiRef, props);
  useGridSorting(apiRef, props);
  useGridDensity(apiRef, props);
  useGridColumnReorder(apiRef, props);
  useGridColumnResize(apiRef, props);
  useGridPagination(apiRef, props);
  useGridRowsMeta(apiRef, props);
  useGridRowReorder(apiRef, props);
  useGridScroll(apiRef, props);
  useGridInfiniteLoader(apiRef, props);
  useGridLazyLoader(apiRef, props);
  useGridColumnMenu(apiRef);
  useGridCsvExport(apiRef);
  useGridExcelExport(apiRef);
  useGridPrintExport(apiRef, props);
  useGridClipboard(apiRef);
  useGridDimensions(apiRef, props);
  useGridEvents(apiRef, props);
  useGridStatePersistence(apiRef);

  return apiRef;
};

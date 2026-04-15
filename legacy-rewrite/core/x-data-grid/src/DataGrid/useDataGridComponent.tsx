import { useGridInitialization } from "../hooks/core/useGridInitialization";
import { useGridClipboard } from "../hooks/features/clipboard/useGridClipboard";
import {
  columnGroupsStateInitializer,
  useGridColumnGrouping,
} from "../hooks/features/columnGrouping/useGridColumnGrouping";
import {
  columnMenuStateInitializer,
  useGridColumnMenu,
} from "../hooks/features/columnMenu/useGridColumnMenu";
import {
  columnsStateInitializer,
  useGridColumns,
} from "../hooks/features/columns/useGridColumns";
import { useGridColumnSpanning } from "../hooks/features/columns/useGridColumnSpanning";
import {
  densityStateInitializer,
  useGridDensity,
} from "../hooks/features/density/useGridDensity";
import { useGridDimensions } from "../hooks/features/dimensions/useGridDimensions";
import {
  editingStateInitializer,
  useGridEditing,
} from "../hooks/features/editing/useGridEditing";
import { useGridEvents } from "../hooks/features/events/useGridEvents";
import { useGridCsvExport } from "../hooks/features/export/useGridCsvExport";
import { useGridExcelExport } from "../hooks/features/export/useGridExcelExport";
import { useGridPrintExport } from "../hooks/features/export/useGridPrintExport";
import {
  filterStateInitializer,
  useGridFilter,
} from "../hooks/features/filter/useGridFilter";
import {
  focusStateInitializer,
  useGridFocus,
} from "../hooks/features/focus/useGridFocus";
import { useGridKeyboardNavigation } from "../hooks/features/keyboardNavigation/useGridKeyboardNavigation";
import {
  paginationStateInitializer,
  useGridPagination,
} from "../hooks/features/pagination/useGridPagination";
import {
  preferencePanelStateInitializer,
  useGridPreferencesPanel,
} from "../hooks/features/preferencesPanel/useGridPreferencesPanel";
import { useGridParamsApi } from "../hooks/features/rows/useGridParamsApi";
import {
  rowsStateInitializer,
  useGridRows,
} from "../hooks/features/rows/useGridRows";
import {
  rowsMetaStateInitializer,
  useGridRowsMeta,
} from "../hooks/features/rows/useGridRowsMeta";
import { useGridRowsPreProcessors } from "../hooks/features/rows/useGridRowsPreProcessors";
import {
  rowSelectionStateInitializer,
  useGridRowSelection,
} from "../hooks/features/rowSelection/useGridRowSelection";
import { useGridScroll } from "../hooks/features/scroll/useGridScroll";
import {
  sortingStateInitializer,
  useGridSorting,
} from "../hooks/features/sorting/useGridSorting";
import { useGridStatePersistence } from "../hooks/features/statePersistence/useGridStatePersistence";
import { useGridInitializeState } from "../hooks/utils/useGridInitializeState";
import {
  GridApiCommunity,
  GridPrivateApiCommunity,
} from "../models/api/gridApiCommunity";
import { DataGridProcessedProps } from "../models/props/DataGridProps";

export const useDataGridComponent = (
  inputApiRef: React.MutableRefObject<GridApiCommunity> | undefined,
  props: DataGridProcessedProps
) => {
  const privateApiRef = useGridInitialization<
    GridPrivateApiCommunity,
    GridApiCommunity
  >(inputApiRef, props);

  /**
   * Register all pre-processors called during state initialization here.
   */
  //useGridRowSelectionPreProcessors(privateApiRef, props);
  useGridRowsPreProcessors(privateApiRef);

  /**
   * Register all state initializers here.
   */
  useGridInitializeState(rowSelectionStateInitializer, privateApiRef, props);
  useGridInitializeState(columnsStateInitializer, privateApiRef, props);
  useGridInitializeState(rowsStateInitializer, privateApiRef, props);
  useGridInitializeState(editingStateInitializer, privateApiRef, props);
  useGridInitializeState(focusStateInitializer, privateApiRef, props);
  useGridInitializeState(sortingStateInitializer, privateApiRef, props);
  useGridInitializeState(preferencePanelStateInitializer, privateApiRef, props);
  useGridInitializeState(filterStateInitializer, privateApiRef, props);
  useGridInitializeState(densityStateInitializer, privateApiRef, props);
  useGridInitializeState(paginationStateInitializer, privateApiRef, props);
  useGridInitializeState(rowsMetaStateInitializer, privateApiRef, props);
  useGridInitializeState(columnMenuStateInitializer, privateApiRef, props);
  useGridInitializeState(columnGroupsStateInitializer, privateApiRef, props);

  useGridKeyboardNavigation(privateApiRef, props);
  useGridRowSelection(privateApiRef, props);
  useGridColumns(privateApiRef, props);
  useGridRows(privateApiRef, props);
  useGridParamsApi(privateApiRef);
  useGridColumnSpanning(privateApiRef);
  useGridColumnGrouping(privateApiRef, props);
  useGridEditing(privateApiRef, props);
  useGridFocus(privateApiRef, props);
  useGridPreferencesPanel(privateApiRef, props);
  useGridFilter(privateApiRef, props);
  useGridSorting(privateApiRef, props);
  useGridDensity(privateApiRef, props);
  useGridPagination(privateApiRef, props);
  useGridRowsMeta(privateApiRef, props);
  useGridScroll(privateApiRef, props);
  useGridColumnMenu(privateApiRef);
  useGridCsvExport(privateApiRef);
  useGridExcelExport(privateApiRef);
  useGridPrintExport(privateApiRef, props);
  useGridClipboard(privateApiRef);
  useGridDimensions(privateApiRef, props);
  useGridEvents(privateApiRef, props);
  useGridStatePersistence(privateApiRef);

  return privateApiRef;
};

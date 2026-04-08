import {
  GridRowId,
  GridRowIdToModelLookup,
  GridRowsProp,
  GridValidRowModel
} from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';

export interface GridPinnedRowsProp<R extends GridValidRowModel = GridValidRowModel> {
  top?: GridRowsProp<R>;
  bottom?: GridRowsProp<R>;
}

export interface GridRowPinningApi {
  /**
   * Changes the pinned rows.
   * @param {GridPinnedRowsProp} pinnedRows An object containing the rows to pin.
   */
  unstable_setPinnedRows: (pinnedRows?: GridPinnedRowsProp) => void;
}

export interface GridRowPinningInternalCache {
  topIds: GridRowId[];
  bottomIds: GridRowId[];
  idLookup: GridRowIdToModelLookup;
}

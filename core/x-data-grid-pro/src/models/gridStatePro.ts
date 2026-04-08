import {
  GridInitialState as GridInitialStateCommunity,
  GridState as GridStateCommunity
} from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';
import type {
  GridColumnPinningState, GridColumnReorderState,
  GridColumnResizeState, GridDetailPanelInitialState, GridDetailPanelState
} from '../hooks';

/**
 * The state of `DataGridPro`.
 */
export interface GridStatePro extends GridStateCommunity {
  columnReorder: GridColumnReorderState;
  columnResize: GridColumnResizeState;
  pinnedColumns: GridColumnPinningState;
  detailPanel: GridDetailPanelState;
}

/**
 * The initial state of `DataGridPro`.
 */
export interface GridInitialStatePro extends GridInitialStateCommunity {
  pinnedColumns?: GridColumnPinningState;
  detailPanel?: GridDetailPanelInitialState;
}

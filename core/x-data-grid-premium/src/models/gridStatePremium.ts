import {
  GridInitialState as GridInitialStatePro,
  GridState as GridStatePro
} from "@geeklabssh/hive-tablepro/core/x-data-grid-pro/src";
import type {
  GridAggregationInitialState, GridAggregationState, GridCellSelectionModel, GridRowGroupingInitialState, GridRowGroupingState
} from '../hooks';

/**
 * The state of `DataGridPremium`.
 */
export interface GridStatePremium extends GridStatePro {
  rowGrouping: GridRowGroupingState;
  aggregation: GridAggregationState;
  cellSelection: GridCellSelectionModel;
}

/**
 * The initial state of `DataGridPremium`.
 */
export interface GridInitialStatePremium extends GridInitialStatePro {
  rowGrouping?: GridRowGroupingInitialState;
  aggregation?: GridAggregationInitialState;
  cellSelection?: GridCellSelectionModel;
}

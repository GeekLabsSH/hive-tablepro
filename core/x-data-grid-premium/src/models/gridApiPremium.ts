import {
  GridApiCommon,
  GridColumnPinningApi, GridColumnReorderApi, GridDetailPanelApi,
  GridDetailPanelPrivateApi, GridRowMultiSelectionApi, GridRowPinningApi, GridRowProApi
} from "@GeekLabsSH/hive-tablepro/core/x-data-grid-pro/src";
import { GridPrivateOnlyApiCommon } from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src/internals';
import type { GridAggregationApi, GridExcelExportApi, GridRowGroupingApi } from '../hooks';
import { GridCellSelectionApi } from '../hooks/features/cellSelection/gridCellSelectionInterfaces';
import { GridInitialStatePremium, GridStatePremium } from './gridStatePremium';

/**
 * The api of `DataGridPremium`.
 * TODO: Do not redefine manually the pro features
 */
export interface GridApiPremium
  extends GridApiCommon<GridStatePremium, GridInitialStatePremium>,
  GridRowProApi,
  GridColumnPinningApi,
  GridDetailPanelApi,
  GridRowGroupingApi,
  GridAggregationApi,
  GridRowPinningApi,
  GridCellSelectionApi,
  // APIs that are private in Community plan, but public in Pro and Premium plans
  GridRowMultiSelectionApi,
  GridColumnReorderApi,
  GridRowProApi { }

export interface GridPrivateApiPremium
  extends GridApiPremium,
  GridPrivateOnlyApiCommon<GridApiPremium, GridPrivateApiPremium>,
  GridDetailPanelPrivateApi { }

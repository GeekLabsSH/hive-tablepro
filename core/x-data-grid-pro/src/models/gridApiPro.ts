import {
  GridApiCommon,
  GridColumnReorderApi,
  GridRowMultiSelectionApi,
  GridRowProApi
} from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src';
import { GridPrivateOnlyApiCommon } from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src/internals';
import type {
  GridColumnPinningApi,
  GridDetailPanelApi, GridDetailPanelPrivateApi, GridRowPinningApi
} from '../hooks';
import { GridInitialStatePro, GridStatePro } from './gridStatePro';

/**
 * The api of `DataGridPro`.
 */
export interface GridApiPro
  extends GridApiCommon<GridStatePro, GridInitialStatePro>,
  GridRowProApi,
  GridColumnPinningApi,
  GridDetailPanelApi,
  GridRowPinningApi,
  // APIs that are private in Community plan, but public in Pro and Premium plans
  GridRowMultiSelectionApi,
  GridColumnReorderApi,
  GridRowProApi { }

export interface GridPrivateApiPro
  extends GridApiPro,
  GridPrivateOnlyApiCommon<GridApiPro, GridPrivateApiPro>,
  GridDetailPanelPrivateApi { }

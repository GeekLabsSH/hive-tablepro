import { createSelector } from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src/internals';
import { GridStatePro } from '../../../models/gridStatePro';

export const gridColumnResizeSelector = (state: GridStatePro) => state.columnResize;

export const gridResizingColumnFieldSelector = createSelector(
  gridColumnResizeSelector,
  (columnResize) => columnResize.resizingColumnField,
);

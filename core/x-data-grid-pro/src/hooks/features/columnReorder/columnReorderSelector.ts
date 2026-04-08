import { createSelector } from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src/internals';
import { GridStatePro } from '../../../models/gridStatePro';

export const gridColumnReorderSelector = (state: GridStatePro) => state.columnReorder;

export const gridColumnReorderDragColSelector = createSelector(
  gridColumnReorderSelector,
  (columnReorder) => columnReorder.dragCol,
);

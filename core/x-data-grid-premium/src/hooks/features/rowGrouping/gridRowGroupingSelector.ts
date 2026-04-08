import { gridColumnLookupSelector } from "@geeklabssh/hive-tablepro/core/x-data-grid-pro/src";
import { createSelector } from '@geeklabssh/hive-tablepro/core/x-data-grid-pro/src/internals';
import { GridStatePremium } from '../../../models/gridStatePremium';

const gridRowGroupingStateSelector = (state: GridStatePremium) => state.rowGrouping;

export const gridRowGroupingModelSelector = createSelector(
  gridRowGroupingStateSelector,
  (rowGrouping) => rowGrouping.model,
);

export const gridRowGroupingSanitizedModelSelector = createSelector(
  gridRowGroupingModelSelector,
  gridColumnLookupSelector,
  (model, columnsLookup) =>
    model.filter((field) => !!columnsLookup[field] && columnsLookup[field].groupable),
);

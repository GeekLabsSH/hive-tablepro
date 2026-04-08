import { GridClassKey } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';

export interface DataGridPremiumComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@cronoslogistics/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridPremiumComponentNameToClassKey { }
}

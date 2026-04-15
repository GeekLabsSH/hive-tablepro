import { GridClassKey } from '@geeklabssh/hive-tablepro/core/x-data-grid/src';

export interface DataGridPremiumComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@geeklabssh/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridPremiumComponentNameToClassKey { }
}

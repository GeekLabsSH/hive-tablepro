import { GridClassKey } from '@geeklabssh/hive-tablepro/core/x-data-grid/src';

export interface DataGridProComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@geeklabssh/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridProComponentNameToClassKey { }
}

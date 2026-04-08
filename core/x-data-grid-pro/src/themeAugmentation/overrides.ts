import { GridClassKey } from '@GeekLabsSH/hive-tablepro/core/x-data-grid/src';

export interface DataGridProComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@GeekLabsSH/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridProComponentNameToClassKey { }
}

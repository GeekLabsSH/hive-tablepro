import { GridClassKey } from '@cronoslogistics/hive-tablepro/core/x-data-grid/src';

export interface DataGridProComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@cronoslogistics/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridProComponentNameToClassKey { }
}

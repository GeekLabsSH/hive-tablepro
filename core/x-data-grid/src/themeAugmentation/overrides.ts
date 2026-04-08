import { GridClassKey } from '../constants/gridClasses';

export interface DataGridComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@GeekLabsSH/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridComponentNameToClassKey { }
}

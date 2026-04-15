import { GridClassKey } from '../constants/gridClasses';

export interface DataGridComponentNameToClassKey {
  MuiDataGrid: GridClassKey;
}

declare module '@geeklabssh/hive-tablepro/core/mui-material/src/styles/overrides' {
  interface ComponentNameToClassKey extends DataGridComponentNameToClassKey { }
}

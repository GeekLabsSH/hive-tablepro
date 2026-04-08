import { unstable_generateUtilityClasses as generateUtilityClasses } from '@GeekLabsSH/hive-tablepro/core/mui-utils/src';
import generateUtilityClass from '../generateUtilityClass';

export interface TableContainerClasses {
  /** Styles applied to the root element. */
  root: string;
}

export type TableContainerClassKey = keyof TableContainerClasses;

export function getTableContainerUtilityClass(slot: string): string {
  return generateUtilityClass('MuiTableContainer', slot);
}

const tableContainerClasses: TableContainerClasses = generateUtilityClasses('MuiTableContainer', [
  'root',
]);

export default tableContainerClasses;

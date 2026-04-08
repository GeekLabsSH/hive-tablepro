import { unstable_generateUtilityClasses as generateUtilityClasses } from '@geeklabssh/hive-tablepro/core/mui-utils/src';
import generateUtilityClass from '../generateUtilityClass';

export interface TableHeadClasses {
  /** Styles applied to the root element. */
  root: string;
}

export type TableHeadClassKey = keyof TableHeadClasses;

export function getTableHeadUtilityClass(slot: string): string {
  return generateUtilityClass('MuiTableHead', slot);
}

const tableHeadClasses: TableHeadClasses = generateUtilityClasses('MuiTableHead', ['root']);

export default tableHeadClasses;

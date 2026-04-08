import { unstable_generateUtilityClasses as generateUtilityClasses } from '@GeekLabsSH/hive-tablepro/core/mui-utils/src';
import generateUtilityClass from '../generateUtilityClass';

export interface TableBodyClasses {
  /** Styles applied to the root element. */
  root: string;
}

export type TableBodyClassKey = keyof TableBodyClasses;

export function getTableBodyUtilityClass(slot: string): string {
  return generateUtilityClass('MuiTableBody', slot);
}

const tableBodyClasses: TableBodyClasses = generateUtilityClasses('MuiTableBody', ['root']);

export default tableBodyClasses;

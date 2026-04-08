import { ContainerClasses } from '@geeklabssh/hive-tablepro/core/mui-system/src';
import { unstable_generateUtilityClasses as generateUtilityClasses } from '@geeklabssh/hive-tablepro/core/mui-utils/src';
import generateUtilityClass from '../generateUtilityClass';

export type { ContainerClassKey } from '@geeklabssh/hive-tablepro/core/mui-system/src';
export type { ContainerClasses };

export function getContainerUtilityClass(slot: string): string {
  return generateUtilityClass('MuiContainer', slot);
}

const containerClasses: ContainerClasses = generateUtilityClasses('MuiContainer', [
  'root',
  'disableGutters',
  'fixed',
  'maxWidthXs',
  'maxWidthSm',
  'maxWidthMd',
  'maxWidthLg',
  'maxWidthXl',
]);

export default containerClasses;

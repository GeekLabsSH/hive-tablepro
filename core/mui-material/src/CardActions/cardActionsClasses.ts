import { unstable_generateUtilityClasses as generateUtilityClasses } from '@GeekLabsSH/hive-tablepro/core/mui-utils/src';
import generateUtilityClass from '../generateUtilityClass';

export interface CardActionsClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to the root element unless `disableSpacing={true}`. */
  spacing: string;
}

export type CardActionsClassKey = keyof CardActionsClasses;

export function getCardActionsUtilityClass(slot: string): string {
  return generateUtilityClass('MuiCardActions', slot);
}

const cardActionsClasses: CardActionsClasses = generateUtilityClasses('MuiCardActions', [
  'root',
  'spacing',
]);

export default cardActionsClasses;

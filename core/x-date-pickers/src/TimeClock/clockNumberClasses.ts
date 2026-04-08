import {
  unstable_generateUtilityClass as generateUtilityClass,
  unstable_generateUtilityClasses as generateUtilityClasses
} from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
;

export interface ClockNumberClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to a selected root element. */
  selected: string;
  /** Styles applied to a disabled root element. */
  disabled: string;
}

export type ClockNumberClassKey = keyof ClockNumberClasses;

export function getClockNumberUtilityClass(slot: string) {
  return generateUtilityClass('MuiClockNumber', slot);
}

export const clockNumberClasses: ClockNumberClasses = generateUtilityClasses('MuiClockNumber', [
  'root',
  'selected',
  'disabled',
]);

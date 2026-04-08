import {
  unstable_generateUtilityClass as generateUtilityClass,
  unstable_generateUtilityClasses as generateUtilityClasses
} from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
;

export interface PickersFadeTransitionGroupClasses {
  /** Styles applied to the root element. */
  root: string;
}

export type PickersFadeTransitionGroupClassKey = keyof PickersFadeTransitionGroupClasses;

export const getPickersFadeTransitionGroupUtilityClass = (slot: string) =>
  generateUtilityClass('MuiPickersFadeTransitionGroup', slot);

export const pickersFadeTransitionGroupClasses: PickersFadeTransitionGroupClasses =
  generateUtilityClasses('MuiPickersFadeTransitionGroup', ['root']);

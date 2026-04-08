import {
  unstable_generateUtilityClass as generateUtilityClass,
  unstable_generateUtilityClasses as generateUtilityClasses
} from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
;

export interface DateTimePickerTabsClasses {
  /** Styles applied to the root element. */
  root: string;
}

export type DateTimePickerTabsClassKey = keyof DateTimePickerTabsClasses;

export function getDateTimePickerTabsUtilityClass(slot: string) {
  return generateUtilityClass('MuiDateTimePickerTabs', slot);
}

export const dateTimePickerTabsClasses: DateTimePickerTabsClasses = generateUtilityClasses(
  'MuiDateTimePickerTabs',
  ['root'],
);

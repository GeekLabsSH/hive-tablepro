import { DateRangeCalendarClassKey } from '../DateRangeCalendar';
import { DateRangePickerToolbarClassKey } from '../DateRangePicker';
import { DateRangePickerDayClassKey } from '../DateRangePickerDay';

// prettier-ignore
export interface PickersProComponentNameToClassKey {
  MuiDateRangeCalendar: DateRangeCalendarClassKey
  MuiDateRangePickerDay: DateRangePickerDayClassKey;
  MuiDateRangePickerToolbar: DateRangePickerToolbarClassKey;
  MuiDateRangePickerViewDesktop: DateRangePickerViewDesktopClassKey;
  MuiMultiInputDateRangeField: never;
  MuiSingleInputDateRangeField: never;

  // Date Range Pickers
  MuiDateRangePicker: never;
  MuiDesktopDateRangePicker: never;
  MuiMobileDateRangePicker: never;
  MuiStaticDateRangePicker: never;
}

declare module '@geeklabssh/hive-tablepro/core/mui-material/src/styles' {
  interface ComponentNameToClassKey extends PickersProComponentNameToClassKey { }
}

// disable automatic export
export { };


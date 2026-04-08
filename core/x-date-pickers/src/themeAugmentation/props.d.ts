import {
  DateCalendarProps,
  ExportedSlideTransitionProps,
  PickersFadeTransitionGroupProps
} from '../DateCalendar';
import { DateFieldProps } from '../DateField';
import { DayCalendarSkeletonProps } from '../DayCalendarSkeleton';
import {
  CalendarOrClockPickerProps,
  DayCalendarProps, ExportedCalendarHeaderProps, ExportedPickersArrowSwitcherProps, ExportedPickersToolbarTextProps, PickerPopperProps,
  PickersToolbarButtonProps,
  PickersToolbarProps
} from '../internals';
import { DateOrTimeView } from '../internals/models';
import { LocalizationProviderProps } from '../LocalizationProvider';
import { ExportedPickersMonthProps, MonthCalendarProps } from '../MonthCalendar';
import { PickersDayProps } from '../PickersDay';
import { PickersLayoutProps } from '../PickersLayout';
import { ClockNumberProps, ClockPointerProps, ClockProps, TimeClockProps } from '../TimeClock';
import { ExportedPickersYearProps, YearCalendarProps } from '../YearCalendar';

import { DatePickerProps, DatePickerToolbarProps } from '../DatePicker';
import { DesktopDatePickerProps } from '../DesktopDatePicker';
import { MobileDatePickerProps } from '../MobileDatePicker';
import { StaticDatePickerProps } from '../StaticDatePicker';

import {
  DateTimePickerProps,
  DateTimePickerTabsProps,
  DateTimePickerToolbarProps
} from '../DateTimePicker';
import { DesktopDateTimePickerProps } from '../DesktopDateTimePicker';
import { MobileDateTimePickerProps } from '../MobileDateTimePicker';
import { StaticDateTimePickerProps } from '../StaticDateTimePicker';

import { DesktopTimePickerProps } from '../DesktopTimePicker';
import { MobileTimePickerProps } from '../MobileTimePicker';
import { StaticTimePickerProps } from '../StaticTimePicker';
import { TimePickerProps, TimePickerToolbarProps } from '../TimePicker';

export interface PickersComponentsPropsList {
  MuiCalendarOrClockPicker: CalendarOrClockPickerProps<unknown, DateOrTimeView>;
  MuiClock: ClockProps<unknown>;
  MuiClockNumber: ClockNumberProps;
  MuiClockPointer: ClockPointerProps;
  MuiDateCalendar: DateCalendarProps<unknown>;
  MuiDateField: DateFieldProps<unknown>;
  MuiDatePickerToolbar: DatePickerToolbarProps<unknown>;
  MuiDateTimePickerTabs: DateTimePickerTabsProps;
  MuiDateTimePickerToolbar: DateTimePickerToolbarProps<unknown>;
  MuiDayCalendar: DayCalendarProps<unknown>;
  MuiDayCalendarSkeleton: DayCalendarSkeletonProps;
  MuiLocalizationProvider: LocalizationProviderProps<unknown>;
  MuiMonthCalendar: MonthCalendarProps<unknown>;
  MuiPickersArrowSwitcher: ExportedPickersArrowSwitcherProps;
  MuiPickersCalendarHeader: ExportedCalendarHeaderProps<unknown>;
  MuiPickersDay: PickersDayProps<unknown>;
  MuiPickersFadeTransitionGroup: PickersFadeTransitionGroupProps;
  MuiPickersMonth: ExportedPickersMonthProps;
  MuiPickersPopper: PickerPopperProps;
  MuiPickersSlideTransition: ExportedSlideTransitionProps;
  MuiPickersToolbar: PickersToolbarProps<unknown, unknown>;
  MuiPickersToolbarButton: PickersToolbarButtonProps;
  MuiPickersToolbarText: ExportedPickersToolbarTextProps;
  MuiPickersLayout: PickersLayoutProps<unknown, DateOrTimeView>;
  MuiPickersYear: ExportedPickersYearProps;
  MuiTimeClock: TimeClockProps<unknown>;
  MuiTimePickerToolbar: TimePickerToolbarProps<unknown>;
  MuiYearCalendar: YearCalendarProps<unknown>;

  // Date Pickers
  MuiDatePicker: DatePickerProps<unknown>;
  MuiDesktopDatePicker: DesktopDatePickerProps<unknown>;
  MuiMobileDatePicker: MobileDatePickerProps<unknown>;
  MuiStaticDatePicker: StaticDatePickerProps<unknown>;

  // Time Pickers
  MuiTimePicker: TimePickerProps<unknown>;
  MuiDesktopTimePicker: DesktopTimePickerProps<unknown>;
  MuiMobileTimePicker: MobileTimePickerProps<unknown>;
  MuiStaticTimePicker: StaticTimePickerProps<unknown>;

  // Date Time Pickers
  MuiDateTimePicker: DateTimePickerProps<unknown>;
  MuiDesktopDateTimePicker: DesktopDateTimePickerProps<unknown>;
  MuiMobileDateTimePicker: MobileDateTimePickerProps<unknown>;
  MuiStaticDateTimePicker: StaticDateTimePickerProps<unknown>;
}

declare module "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles"; {
  interface ComponentsPropsList extends PickersComponentsPropsList { }
}

// disable automatic export
export { };


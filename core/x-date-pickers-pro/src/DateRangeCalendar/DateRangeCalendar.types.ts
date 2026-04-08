import { SlotComponentProps } from '@GeekLabsSH/hive-tablepro/core/mui-base/src';
import { Theme } from '@GeekLabsSH/hive-tablepro/core/mui-material/src/styles';
import { SxProps } from "@GeekLabsSH/hive-tablepro/core/mui-system/src";
import {
  BaseDateValidationProps, DayCalendarProps, DayCalendarSlotsComponent,
  DayCalendarSlotsComponentsProps, DefaultizedProps,
  ExportedDayCalendarProps, ExportedUseViewsOptions, PickersArrowSwitcherSlotsComponent,
  PickersArrowSwitcherSlotsComponentsProps, PickersCalendarHeaderSlotsComponent,
  PickersCalendarHeaderSlotsComponentsProps, PickerSelectionState, UncapitalizeObjectKeys
} from '@GeekLabsSH/hive-tablepro/core/x-date-pickers/src/internals';
import * as React from 'react';
import { DateRangePickerDay, DateRangePickerDayProps } from '../DateRangePickerDay';
import { DateRange, DayRangeValidationProps, RangePositionProps } from '../internal/models';
import { DateRangeCalendarClasses } from './dateRangeCalendarClasses';

export type DateRangePosition = 'start' | 'end';

export interface DateRangeCalendarSlotsComponent<TDate>
  extends PickersArrowSwitcherSlotsComponent,
  Omit<DayCalendarSlotsComponent<TDate>, 'Day'>,
  PickersCalendarHeaderSlotsComponent {
  /**
   * Custom component for day in range pickers.
   * Check the [DateRangePickersDay](https://mui.com/x/api/date-pickers/date-range-picker-day/) component.
   * @default DateRangePickersDay
   */
  Day?: React.ElementType<DateRangePickerDayProps<TDate>>;
}

export interface DateRangeCalendarSlotsComponentsProps<TDate>
  extends PickersArrowSwitcherSlotsComponentsProps,
  Omit<DayCalendarSlotsComponentsProps<TDate>, 'day'>,
  PickersCalendarHeaderSlotsComponentsProps<TDate> {
  day?: SlotComponentProps<
    typeof DateRangePickerDay,
    {},
    DayCalendarProps<TDate> & { day: TDate; selected: boolean }
  >;
}

export interface ExportedDateRangeCalendarProps<TDate>
  extends ExportedDayCalendarProps,
  BaseDateValidationProps<TDate>,
  DayRangeValidationProps<TDate>,
  // TODO: Add the other props of `ExportedUseViewOptions` once `DateRangeCalendar` handles several views
  Pick<ExportedUseViewsOptions<'day'>, 'autoFocus'> {
  /**
   * If `true`, after selecting `start` date calendar will not automatically switch to the month of `end` date.
   * @default false
   */
  disableAutoMonthSwitching?: boolean;
  /**
   * Default calendar month displayed when `value={[null, null]}`.
   */
  defaultCalendarMonth?: TDate;
  /**
   * If `true`, the picker and text field are disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Make picker read only.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Disable heavy animations.
   * @default typeof navigator !== 'undefined' && /(android)/i.test(navigator.userAgent)
   */
  reduceAnimations?: boolean;
  /**
   * Callback firing on month change @DateIOType.
   * @template TDate
   * @param {TDate} month The new month.
   * @returns {void|Promise} -
   */
  onMonthChange?: (month: TDate) => void | Promise<void>;
  /**
   * The number of calendars to render.
   * @default 2
   */
  calendars?: 1 | 2 | 3;
  /**
   * If `true`, editing dates by dragging is disabled.
   * @default false
   */
  disableDragEditing?: boolean;
}

export interface DateRangeCalendarProps<TDate>
  extends ExportedDateRangeCalendarProps<TDate>,
  Partial<RangePositionProps> {
  /**
   * The selected value.
   * Used when the component is controlled.
   */
  value?: DateRange<TDate>;
  /**
   * The default selected value.
   * Used when the component is not controlled.
   */
  defaultValue?: DateRange<TDate>;
  /**
   * Callback fired when the value changes.
   * @template TDate
   * @param {DateRange<TDate>} value The new value.
   * @param {PickerSelectionState | undefined} selectionState Indicates if the date range selection is complete.
   */
  onChange?: (value: DateRange<TDate>, selectionState?: PickerSelectionState) => void;
  className?: string;
  classes?: Partial<DateRangeCalendarClasses>;
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps<Theme>;
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: DateRangeCalendarSlotsComponent<TDate>;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: DateRangeCalendarSlotsComponentsProps<TDate>;
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots?: UncapitalizeObjectKeys<DateRangeCalendarSlotsComponent<TDate>>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: DateRangeCalendarSlotsComponentsProps<TDate>;
}

export interface DateRangeCalendarOwnerState<TDate> extends DateRangeCalendarProps<TDate> {
  isDragging: boolean;
}

export type DateRangeCalendarDefaultizedProps<TDate> = DefaultizedProps<
  DateRangeCalendarProps<TDate>,
  'reduceAnimations' | 'calendars' | 'disableDragEditing' | keyof BaseDateValidationProps<TDate>
>;

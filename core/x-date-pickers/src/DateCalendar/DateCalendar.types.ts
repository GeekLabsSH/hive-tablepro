import { Theme } from "@GeekLabsSH/hive-tablepro/core/mui-material/src/styles";
import { SxProps } from "@GeekLabsSH/hive-tablepro/core/mui-system/src";
import * as React from 'react';
import { PickerSelectionState } from '../internals/hooks/usePicker/usePickerValue';
import { ExportedUseViewsOptions } from '../internals/hooks/useViews';
import {
  BaseDateValidationProps, DayValidationProps, MonthValidationProps, YearValidationProps
} from '../internals/hooks/validation/models';
import { DefaultizedProps } from '../internals/models/helpers';
import { DateView } from '../internals/models/views';
import { SlotsAndSlotProps } from '../internals/utils/slots-migration';
import { ExportedMonthCalendarProps } from '../MonthCalendar/MonthCalendar.types';
import { ExportedYearCalendarProps } from '../YearCalendar/YearCalendar.types';
import { DateCalendarClasses } from './dateCalendarClasses';
import {
  DayCalendarSlotsComponent,
  DayCalendarSlotsComponentsProps,
  ExportedDayCalendarProps
} from './DayCalendar';
import {
  PickersCalendarHeaderSlotsComponent,
  PickersCalendarHeaderSlotsComponentsProps
} from './PickersCalendarHeader';
;
;

export interface DateCalendarSlotsComponent<TDate>
  extends PickersCalendarHeaderSlotsComponent,
  DayCalendarSlotsComponent<TDate> { }

export interface DateCalendarSlotsComponentsProps<TDate>
  extends PickersCalendarHeaderSlotsComponentsProps<TDate>,
  DayCalendarSlotsComponentsProps<TDate> { }

export interface ExportedDateCalendarProps<TDate>
  extends ExportedDayCalendarProps,
  ExportedMonthCalendarProps,
  ExportedYearCalendarProps,
  BaseDateValidationProps<TDate>,
  DayValidationProps<TDate>,
  YearValidationProps<TDate>,
  MonthValidationProps<TDate> {
  /**
   * Default calendar month displayed when `value={null}`.
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
   * Component displaying when passed `loading` true.
   * @returns {React.ReactNode} The node to render when loading.
   * @default () => <span data-mui-test="loading-progress">...</span>
   */
  renderLoading?: () => React.ReactNode;
  /**
   * Callback firing on year change @DateIOType.
   * @template TDate
   * @param {TDate} year The new year.
   */
  onYearChange?: (year: TDate) => void;
  /**
   * Callback firing on month change @DateIOType.
   * @template TDate
   * @param {TDate} month The new month.
   * @returns {void|Promise} -
   */
  onMonthChange?: (month: TDate) => void | Promise<void>;
}

export interface DateCalendarProps<TDate>
  extends ExportedDateCalendarProps<TDate>,
  ExportedUseViewsOptions<DateView>,
  SlotsAndSlotProps<DateCalendarSlotsComponent<TDate>, DateCalendarSlotsComponentsProps<TDate>> {
  /**
   * The selected value.
   * Used when the component is controlled.
   */
  value?: TDate | null;
  /**
   * The default selected value.
   * Used when the component is not controlled.
   */
  defaultValue?: TDate | null;
  /**
   * Callback fired when the value changes.
   * @template TDate
   * @param {TDate | null} value The new value.
   * @param {PickerSelectionState | undefined} selectionState Indicates if the date selection is complete.
   */
  onChange?: (value: TDate | null, selectionState?: PickerSelectionState) => void;
  className?: string;
  classes?: Partial<DateCalendarClasses>;
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx?: SxProps<Theme>;
}

export type DateCalendarDefaultizedProps<TDate> = DefaultizedProps<
  DateCalendarProps<TDate>,
  | 'views'
  | 'openTo'
  | 'loading'
  | 'reduceAnimations'
  | 'renderLoading'
  | keyof BaseDateValidationProps<TDate>
>;

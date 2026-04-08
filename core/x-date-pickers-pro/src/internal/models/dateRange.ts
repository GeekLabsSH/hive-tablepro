import {
  BaseDateValidationProps,
  DefaultizedProps,
  MakeOptional,
  UseFieldInternalProps
} from '@cronoslogistics/hive-tablepro/core/x-date-pickers/src/internals';
import type { DateRangeValidationError } from '../hooks/validation/useDateRangeValidation';
import { DateRange } from './range';

/**
 * Props used to validate a day value in range pickers.
 */
export interface DayRangeValidationProps<TDate> {
  /**
   * Disable specific date. @DateIOType
   * @template TDate
   * @param {TDate} day The date to test.
   * @param {string} position The date to test, 'start' or 'end'.
   * @returns {boolean} Returns `true` if the date should be disabled.
   */
  shouldDisableDate?: (day: TDate, position: 'start' | 'end') => boolean;
}

/**
 * Props used in every range picker.
 */
export interface BaseRangeProps {
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled?: boolean;
}

export interface UseDateRangeFieldProps<TDate>
  extends MakeOptional<UseFieldInternalProps<DateRange<TDate>, DateRangeValidationError>, 'format'>,
  DayRangeValidationProps<TDate>,
  BaseDateValidationProps<TDate>,
  BaseRangeProps { }

export type UseDateRangeFieldDefaultizedProps<TDate> = DefaultizedProps<
  UseDateRangeFieldProps<TDate>,
  keyof BaseDateValidationProps<TDate> | 'format'
>;

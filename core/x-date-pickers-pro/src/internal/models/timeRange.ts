import {
  BaseTimeValidationProps, DefaultizedProps,
  MakeOptional, TimeValidationProps, UseFieldInternalProps
} from '@GeekLabsSH/hive-tablepro/core/x-date-pickers/src/internals';
import { TimeRangeValidationError } from '../hooks/validation/useTimeRangeValidation';
import { BaseRangeProps } from './dateRange';
import { DateRange } from './range';

export interface UseTimeRangeFieldProps<TDate>
  extends MakeOptional<UseFieldInternalProps<DateRange<TDate>, TimeRangeValidationError>, 'format'>,
  TimeValidationProps<TDate>,
  BaseTimeValidationProps,
  BaseRangeProps {
  /**
   * 12h/24h view for hour selection clock.
   * @default `utils.is12HourCycleInCurrentLocale()`
   */
  ampm?: boolean;
}

export type UseTimeRangeFieldDefaultizedProps<TDate> = DefaultizedProps<
  UseTimeRangeFieldProps<TDate>,
  keyof BaseTimeValidationProps | 'format'
>;

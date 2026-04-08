import { MakeOptional, UncapitalizeObjectKeys } from '@GeekLabsSH/hive-tablepro/core/x-date-pickers/src/internals';
import {
  BaseDateRangePickerProps,
  BaseDateRangePickerSlotsComponent,
  BaseDateRangePickerSlotsComponentsProps
} from '../DateRangePicker/shared';
import {
  StaticRangeOnlyPickerProps,
  UseStaticRangePickerSlotsComponent,
  UseStaticRangePickerSlotsComponentsProps
} from '../internal/hooks/useStaticRangePicker';

export interface StaticDateRangePickerSlotsComponent<TDate>
  extends BaseDateRangePickerSlotsComponent<TDate>,
  UseStaticRangePickerSlotsComponent<TDate, 'day'> { }

export interface StaticDateRangePickerSlotsComponentsProps<TDate>
  extends BaseDateRangePickerSlotsComponentsProps<TDate>,
  UseStaticRangePickerSlotsComponentsProps<TDate, 'day'> { }

export interface StaticDateRangePickerProps<TDate>
  extends BaseDateRangePickerProps<TDate>,
  MakeOptional<StaticRangeOnlyPickerProps, 'displayStaticWrapperAs'> {
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: StaticDateRangePickerSlotsComponent<TDate>;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: StaticDateRangePickerSlotsComponentsProps<TDate>;
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots?: UncapitalizeObjectKeys<StaticDateRangePickerSlotsComponent<TDate>>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: StaticDateRangePickerSlotsComponentsProps<TDate>;
}

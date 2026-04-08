import { SlotComponentProps } from "@GeekLabsSH/hive-tablepro/core/mui-base/src/utils";
import TextField from "@GeekLabsSH/hive-tablepro/core/mui-material/src/TextField";
import * as React from 'react';
import { FieldsTextFieldProps, UncapitalizeObjectKeys } from '../internals';
import { UseFieldInternalProps } from '../internals/hooks/useField';
import { BaseTimeValidationProps, TimeValidationProps } from '../internals/hooks/validation/models';
import { TimeValidationError } from '../internals/hooks/validation/useTimeValidation';
import { DefaultizedProps, MakeOptional } from '../internals/models/helpers';

export interface UseTimeFieldParams<TDate, TChildProps extends {}> {
  props: UseTimeFieldComponentProps<TDate, TChildProps>;
  inputRef?: React.Ref<HTMLInputElement>;
}

export interface UseTimeFieldProps<TDate>
  extends MakeOptional<UseFieldInternalProps<TDate | null, TimeValidationError>, 'format'>,
  TimeValidationProps<TDate>,
  BaseTimeValidationProps {
  /**
   * 12h/24h view for hour selection clock.
   * @default `utils.is12HourCycleInCurrentLocale()`
   */
  ampm?: boolean;
}

export type UseTimeFieldDefaultizedProps<TDate> = DefaultizedProps<
  UseTimeFieldProps<TDate>,
  keyof BaseTimeValidationProps | 'format'
>;

export type UseTimeFieldComponentProps<TDate, TChildProps extends {}> = Omit<
  TChildProps,
  keyof UseTimeFieldProps<TDate>
> &
  UseTimeFieldProps<TDate>;

export interface TimeFieldProps<TDate>
  extends UseTimeFieldComponentProps<TDate, FieldsTextFieldProps> {
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: TimeFieldSlotsComponent;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: TimeFieldSlotsComponentsProps<TDate>;
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots?: UncapitalizeObjectKeys<TimeFieldSlotsComponent>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: TimeFieldSlotsComponentsProps<TDate>;
}

export type TimeFieldOwnerState<TDate> = TimeFieldProps<TDate>;

export interface TimeFieldSlotsComponent {
  /**
   * Form control with an input to render the value.
   * Receives the same props as `@GeekLabsSH/hive-tablepro/core/mui-material/src/TextField`.
   * @default TextField from '@mui/material'
   */
  TextField?: React.ElementType;
}

export interface TimeFieldSlotsComponentsProps<TDate> {
  textField?: SlotComponentProps<typeof TextField, {}, TimeFieldOwnerState<TDate>>;
}

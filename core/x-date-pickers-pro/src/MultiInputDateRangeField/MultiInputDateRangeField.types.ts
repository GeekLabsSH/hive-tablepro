import { SlotComponentProps } from '@geeklabssh/hive-tablepro/core/mui-base/src/utils';
import Stack, { StackProps } from '@geeklabssh/hive-tablepro/core/mui-material/src/Stack';
import TextField from '@geeklabssh/hive-tablepro/core/mui-material/src/TextField';
import Typography from '@geeklabssh/hive-tablepro/core/mui-material/src/Typography';
import { UncapitalizeObjectKeys } from '@geeklabssh/hive-tablepro/core/x-date-pickers/src/internals';
import * as React from 'react';
import { UseDateRangeFieldProps } from '../internal/models/dateRange';
import { RangePosition } from '../internal/models/range';

export interface UseMultiInputDateRangeFieldParams<TDate, TChildProps extends {}> {
  sharedProps: Omit<TChildProps, keyof UseMultiInputDateRangeFieldProps<TDate>> &
  UseMultiInputDateRangeFieldProps<TDate>;
  startTextFieldProps: TChildProps;
  endTextFieldProps: TChildProps;
  startInputRef?: React.Ref<HTMLInputElement>;
  endInputRef?: React.Ref<HTMLInputElement>;
}

export interface UseMultiInputDateRangeFieldProps<TDate> extends UseDateRangeFieldProps<TDate> { }

export type UseMultiInputDateRangeFieldComponentProps<TDate, TChildProps extends {}> = Omit<
  TChildProps,
  keyof UseMultiInputDateRangeFieldProps<TDate>
> &
  UseMultiInputDateRangeFieldProps<TDate>;

export interface MultiInputDateRangeFieldProps<TDate>
  extends UseMultiInputDateRangeFieldComponentProps<
    TDate,
    Omit<StackProps, 'position'> & { autoFocus?: boolean }
  > {
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: MultiInputDateRangeFieldSlotsComponent;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: MultiInputDateRangeFieldSlotsComponentsProps<TDate>;
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots?: UncapitalizeObjectKeys<MultiInputDateRangeFieldSlotsComponent>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: MultiInputDateRangeFieldSlotsComponentsProps<TDate>;
}

export type MultiInputDateRangeFieldOwnerState<TDate> = MultiInputDateRangeFieldProps<TDate>;

export interface MultiInputDateRangeFieldSlotsComponent {
  /**
   * Element rendered at the root.
   * @default MultiInputDateRangeFieldRoot
   */
  Root?: React.ElementType;
  /**
   * Form control with an input to render a date.
   * It is rendered twice: once for the start date and once for the end date.
   * Receives the same props as `@geeklabssh/hive-tablepro/core/mui-material/src/TextField`.
   * @default TextField from '@mui/material'
   */
  TextField?: React.ElementType;
  /**
   * Element rendered between the two inputs.
   * @default MultiInputDateRangeFieldSeparator
   */
  Separator?: React.ElementType;
}

export interface MultiInputDateRangeFieldSlotsComponentsProps<TDate> {
  root?: SlotComponentProps<typeof Stack, {}, MultiInputDateRangeFieldOwnerState<TDate>>;
  textField?: SlotComponentProps<
    typeof TextField,
    {},
    MultiInputDateRangeFieldOwnerState<TDate> & { position: RangePosition }
  >;
  separator?: SlotComponentProps<typeof Typography, {}, MultiInputDateRangeFieldOwnerState<TDate>>;
}

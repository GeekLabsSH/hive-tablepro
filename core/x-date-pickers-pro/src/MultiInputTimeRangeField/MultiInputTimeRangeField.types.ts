import { SlotComponentProps } from '@cronoslogistics/hive-tablepro/core/mui-base/src/utils';
import Stack, { StackProps } from '@cronoslogistics/hive-tablepro/core/mui-material/src/Stack';
import TextField from '@cronoslogistics/hive-tablepro/core/mui-material/src/TextField';
import Typography from '@cronoslogistics/hive-tablepro/core/mui-material/src/Typography';
import { UncapitalizeObjectKeys } from '@cronoslogistics/hive-tablepro/core/x-date-pickers/src/internals';
import * as React from 'react';
import { RangePosition } from '../internal/models/range';
import {
  UseTimeRangeFieldDefaultizedProps,
  UseTimeRangeFieldProps
} from '../internal/models/timeRange';

export interface UseMultiInputTimeRangeFieldParams<TDate, TChildProps extends {}> {
  sharedProps: Omit<TChildProps, keyof UseMultiInputTimeRangeFieldProps<TDate>> &
  UseMultiInputTimeRangeFieldProps<TDate>;
  startTextFieldProps: TChildProps;
  endTextFieldProps: TChildProps;
  startInputRef?: React.Ref<HTMLInputElement>;
  endInputRef?: React.Ref<HTMLInputElement>;
}

export interface UseMultiInputTimeRangeFieldProps<TDate> extends UseTimeRangeFieldProps<TDate> { }

export type UseMultiInputTimeRangeFieldComponentProps<TDate, TChildProps extends {}> = Omit<
  TChildProps,
  keyof UseMultiInputTimeRangeFieldProps<TDate>
> &
  UseMultiInputTimeRangeFieldProps<TDate>;

export interface MultiInputTimeRangeFieldProps<TDate>
  extends UseMultiInputTimeRangeFieldComponentProps<TDate, Omit<StackProps, 'position'>> {
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: MultiInputTimeRangeFieldSlotsComponent;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: MultiInputTimeRangeFieldSlotsComponentsProps<TDate>;
  /**
   * Overrideable slots.
   * @default {}
   */
  slots?: UncapitalizeObjectKeys<MultiInputTimeRangeFieldSlotsComponent>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: MultiInputTimeRangeFieldSlotsComponentsProps<TDate>;
}

export type MultiInputTimeRangeFieldOwnerState<TDate> = MultiInputTimeRangeFieldProps<TDate>;

export interface MultiInputTimeRangeFieldSlotsComponent {
  /**
   * Element rendered at the root.
   * @default MultiInputTimeRangeFieldRoot
   */
  Root?: React.ElementType;
  /**
   * Form control with an input to render a time.
   * It is rendered twice: once for the start time and once for the end time.
   * Receives the same props as `@cronoslogistics/hive-tablepro/core/mui-material/src/TextField`.
   * @default TextField from '@mui/material'
   */
  TextField?: React.ElementType;
  /**
   * Element rendered between the two inputs.
   * @default MultiInputTimeRangeFieldSeparator
   */
  Separator?: React.ElementType;
}

export interface MultiInputTimeRangeFieldSlotsComponentsProps<TDate> {
  root?: SlotComponentProps<typeof Stack, {}, MultiInputTimeRangeFieldOwnerState<TDate>>;
  textField?: SlotComponentProps<
    typeof TextField,
    {},
    MultiInputTimeRangeFieldOwnerState<TDate> & { position: RangePosition }
  >;
  separator?: SlotComponentProps<typeof Typography, {}, MultiInputTimeRangeFieldOwnerState<TDate>>;
}

export type UseMultiInputTimeRangeFieldDefaultizedProps<
  TDate,
  AdditionalProps extends {},
> = UseTimeRangeFieldDefaultizedProps<TDate> & AdditionalProps;

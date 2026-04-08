import { SlotComponentProps } from '@cronoslogistics/hive-tablepro/core/mui-base/src/utils';
import Stack, { StackProps } from '@cronoslogistics/hive-tablepro/core/mui-material/src/Stack';
import TextField, { TextFieldProps } from '@cronoslogistics/hive-tablepro/core/mui-material/src/TextField';
import Typography, { TypographyProps } from '@cronoslogistics/hive-tablepro/core/mui-material/src/Typography';
import {
  BaseNonStaticPickerProps, BasePickerProps, DateOrTimeView, ExportedBaseToolbarProps, PickersPopperSlotsComponent,
  PickersPopperSlotsComponentsProps, UncapitalizeObjectKeys, UsePickerParams, UsePickerValueNonStaticProps,
  UsePickerViewsNonStaticProps, UsePickerViewsProps
} from '@cronoslogistics/hive-tablepro/core/x-date-pickers/src/internals';
import {
  ExportedPickersLayoutSlotsComponent,
  ExportedPickersLayoutSlotsComponentsProps
} from '@cronoslogistics/hive-tablepro/core/x-date-pickers/src/PickersLayout/PickersLayout.types';
import * as React from 'react';
import { DateRange, RangePositionProps } from '../../models';
import { BaseMultiInputFieldProps } from '../../models/fields';

export interface UseDesktopRangePickerSlotsComponent<TDate, TView extends DateOrTimeView>
  extends PickersPopperSlotsComponent,
  ExportedPickersLayoutSlotsComponent<DateRange<TDate>, TView> {
  Field: React.ElementType;
  FieldRoot?: React.ElementType<StackProps>;
  FieldSeparator?: React.ElementType<TypographyProps>;
  /**
   * Form control with an input to render a date or time inside the default field.
   * It is rendered twice: once for the start element and once for the end element.
   * Receives the same props as `@cronoslogistics/hive-tablepro/core/mui-material/src/TextField`.
   * @default TextField from '@mui/material'
   */
  TextField?: React.ElementType<TextFieldProps>;
}

export interface UseDesktopRangePickerSlotsComponentsProps<TDate, TView extends DateOrTimeView>
  extends PickersPopperSlotsComponentsProps,
  ExportedPickersLayoutSlotsComponentsProps<DateRange<TDate>, TView> {
  field?: SlotComponentProps<
    React.ElementType<BaseMultiInputFieldProps<DateRange<TDate>, unknown>>,
    {},
    unknown
  >;
  fieldRoot?: SlotComponentProps<typeof Stack, {}, unknown>;
  fieldSeparator?: SlotComponentProps<typeof Typography, {}, unknown>;
  textField?: SlotComponentProps<typeof TextField, {}, unknown>;
  toolbar?: ExportedBaseToolbarProps;
}

export interface DesktopRangeOnlyPickerProps<TDate>
  extends BaseNonStaticPickerProps,
  UsePickerValueNonStaticProps<TDate | null>,
  UsePickerViewsNonStaticProps {
  /**
   * If `true`, the start `input` element is focused during the first mount.
   */
  autoFocus?: boolean;
}

export interface UseDesktopRangePickerProps<
  TDate,
  TView extends DateOrTimeView,
  TError,
  TExternalProps extends UsePickerViewsProps<any, TView, any, any>,
> extends DesktopRangeOnlyPickerProps<TDate>,
  BasePickerProps<
    DateRange<TDate>,
    TDate,
    TView,
    TError,
    TExternalProps,
    DesktopRangePickerAdditionalViewProps
  > {
  /**
   * Overrideable components.
   * @default {}
   * @deprecated Please use `slots`.
   */
  components?: UseDesktopRangePickerSlotsComponent<TDate, TView>;
  /**
   * The props used for each component slot.
   * @default {}
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: UseDesktopRangePickerSlotsComponentsProps<TDate, TView>;
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots: UncapitalizeObjectKeys<UseDesktopRangePickerSlotsComponent<TDate, TView>>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: UseDesktopRangePickerSlotsComponentsProps<TDate, TView>;
}

export interface DesktopRangePickerAdditionalViewProps extends RangePositionProps { }

export interface UseDesktopRangePickerParams<
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseDesktopRangePickerProps<TDate, TView, any, TExternalProps>,
> extends Pick<
  UsePickerParams<
    DateRange<TDate>,
    TDate,
    TView,
    TExternalProps,
    DesktopRangePickerAdditionalViewProps
  >,
  'valueManager' | 'validator'
> {
  props: TExternalProps;
}

import { SlotComponentProps } from '@geeklabssh/hive-tablepro/core/mui-base/src/utils';
import Stack, { StackProps } from '@geeklabssh/hive-tablepro/core/mui-material/src/Stack';
import TextField, { TextFieldProps } from '@geeklabssh/hive-tablepro/core/mui-material/src/TextField';
import Typography, { TypographyProps } from '@geeklabssh/hive-tablepro/core/mui-material/src/Typography';
import {
  BaseNonStaticPickerProps, BasePickerProps, DateOrTimeView, ExportedBaseToolbarProps, PickersModalDialogSlotsComponent,
  PickersModalDialogSlotsComponentsProps, UncapitalizeObjectKeys, UsePickerParams, UsePickerValueNonStaticProps,
  UsePickerViewsNonStaticProps, UsePickerViewsProps
} from '@geeklabssh/hive-tablepro/core/x-date-pickers/src/internals';
import {
  ExportedPickersLayoutSlotsComponent,
  ExportedPickersLayoutSlotsComponentsProps
} from '@geeklabssh/hive-tablepro/core/x-date-pickers/src/PickersLayout/PickersLayout.types';
import * as React from 'react';
import { DateRange, RangePositionProps } from '../../models';
import { BaseMultiInputFieldProps } from '../../models/fields';

export interface UseMobileRangePickerSlotsComponent<TDate, TView extends DateOrTimeView>
  extends PickersModalDialogSlotsComponent,
  ExportedPickersLayoutSlotsComponent<DateRange<TDate>, TView> {
  Field: React.ElementType;
  FieldRoot?: React.ElementType<StackProps>;
  FieldSeparator?: React.ElementType<TypographyProps>;
  /**
   * Form control with an input to render a date or time inside the default field.
   * Receives the same props as `@geeklabssh/hive-tablepro/core/mui-material/src/TextField`.
   * @default TextField from '@mui/material'
   */
  TextField?: React.ElementType<TextFieldProps>;
}

export interface UseMobileRangePickerSlotsComponentsProps<TDate, TView extends DateOrTimeView>
  extends PickersModalDialogSlotsComponentsProps,
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

export interface MobileRangeOnlyPickerProps<TDate>
  extends BaseNonStaticPickerProps,
  UsePickerValueNonStaticProps<TDate | null>,
  UsePickerViewsNonStaticProps { }

export interface UseMobileRangePickerProps<
  TDate,
  TView extends DateOrTimeView,
  TError,
  TExternalProps extends UsePickerViewsProps<any, TView, any, any>,
> extends MobileRangeOnlyPickerProps<TDate>,
  BasePickerProps<
    DateRange<TDate>,
    TDate,
    TView,
    TError,
    TExternalProps,
    MobileRangePickerAdditionalViewProps
  > {
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots: UncapitalizeObjectKeys<UseMobileRangePickerSlotsComponent<TDate, TView>>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: UseMobileRangePickerSlotsComponentsProps<TDate, TView>;
}

export interface MobileRangePickerAdditionalViewProps extends RangePositionProps { }

export interface UseMobileRangePickerParams<
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseMobileRangePickerProps<TDate, TView, any, TExternalProps>,
> extends Pick<
  UsePickerParams<
    DateRange<TDate>,
    TDate,
    TView,
    TExternalProps,
    MobileRangePickerAdditionalViewProps
  >,
  'valueManager' | 'validator'
> {
  props: TExternalProps;
}

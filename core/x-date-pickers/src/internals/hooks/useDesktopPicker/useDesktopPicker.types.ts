import { SlotComponentProps } from "@cronoslogistics/hive-tablepro/core/mui-base/src/utils";
import IconButton, { IconButtonProps } from "@cronoslogistics/hive-tablepro/core/mui-material/src/IconButton";
import { InputAdornmentProps } from '@cronoslogistics/hive-tablepro/core/mui-material/src/InputAdornment';
import TextField, { TextFieldProps } from "@cronoslogistics/hive-tablepro/core/mui-material/src/TextField";
import * as React from 'react';
import {
  ExportedPickersLayoutSlotsComponent,
  ExportedPickersLayoutSlotsComponentsProps
} from '../../../PickersLayout/PickersLayout.types';
import {
  PickersPopperSlotsComponent,
  PickersPopperSlotsComponentsProps
} from '../../components/PickersPopper';
import { DateOrTimeView, MuiPickersAdapter } from '../../models';
import { BaseFieldProps } from '../../models/fields';
import {
  BaseNonStaticPickerProps,
  BasePickerProps,
  BaseSingleInputNonStaticPickerProps
} from '../../models/props/basePickerProps';
import { UncapitalizeObjectKeys } from '../../utils/slots-migration';
import { UsePickerParams, UsePickerProps } from '../usePicker';
import { UsePickerValueNonStaticProps } from '../usePicker/usePickerValue';
import { UsePickerViewsNonStaticProps, UsePickerViewsProps } from '../usePicker/usePickerViews';

export interface UseDesktopPickerSlotsComponent<TDate, TView extends DateOrTimeView>
  extends PickersPopperSlotsComponent,
  ExportedPickersLayoutSlotsComponent<TDate | null, TView> {
  /**
   * Component used to enter the date with the keyboard.
   */
  Field: React.ElementType<BaseFieldProps<TDate | null, any>>;
  /**
   * Form control with an input to render the value inside the default field.
   * Receives the same props as `@cronoslogistics/hive-tablepro/core/mui-material/src/TextField`.
   * @default TextField from '@mui/material'
   */
  TextField?: React.ElementType<TextFieldProps>;
  /**
   * Component displayed on the start or end input adornment used to open the picker on desktop.
   * @default InputAdornment
   */
  InputAdornment?: React.ElementType<InputAdornmentProps>;
  /**
   * Button to open the picker on desktop.
   * @default IconButton
   */
  OpenPickerButton?: React.ElementType<IconButtonProps>;
  /**
   * Icon displayed in the open picker button on desktop.
   */
  OpenPickerIcon: React.ElementType;
}

export interface UseDesktopPickerSlotsComponentsProps<TDate, TView extends DateOrTimeView>
  extends PickersPopperSlotsComponentsProps,
  ExportedPickersLayoutSlotsComponentsProps<TDate | null, TView> {
  field?: SlotComponentProps<
    React.ElementType<BaseFieldProps<TDate | null, unknown>>,
    {},
    UsePickerProps<TDate | null, any, any, any, any>
  >;
  textField?: SlotComponentProps<typeof TextField, {}, Record<string, any>>;
  inputAdornment?: Partial<InputAdornmentProps>;
  openPickerButton?: SlotComponentProps<
    typeof IconButton,
    {},
    UseDesktopPickerProps<TDate, any, any, any>
  >;
  openPickerIcon?: Record<string, any>;
}

export interface DesktopOnlyPickerProps<TDate>
  extends BaseNonStaticPickerProps,
  BaseSingleInputNonStaticPickerProps,
  UsePickerValueNonStaticProps<TDate | null>,
  UsePickerViewsNonStaticProps {
  /**
   * If `true`, the `input` element is focused during the first mount.
   */
  autoFocus?: boolean;
}

export interface UseDesktopPickerProps<
  TDate,
  TView extends DateOrTimeView,
  TError,
  TExternalProps extends UsePickerViewsProps<any, TView, any, any>,
> extends BasePickerProps<TDate | null, TDate, TView, TError, TExternalProps, {}>,
  DesktopOnlyPickerProps<TDate> {
  /**
   * Overrideable component slots.
   * @default {}
   */
  slots: UncapitalizeObjectKeys<UseDesktopPickerSlotsComponent<TDate, TView>>;
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps?: UseDesktopPickerSlotsComponentsProps<TDate, TView>;
}

export interface UseDesktopPickerParams<
  TDate,
  TView extends DateOrTimeView,
  TExternalProps extends UseDesktopPickerProps<TDate, TView, any, TExternalProps>,
> extends Pick<
  UsePickerParams<TDate | null, TDate, TView, TExternalProps, {}>,
  'valueManager' | 'validator'
> {
  props: TExternalProps;
  getOpenDialogAriaText: (date: TDate | null, utils: MuiPickersAdapter<TDate>) => string;
}

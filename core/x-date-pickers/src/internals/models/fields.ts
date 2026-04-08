import { SlotComponentProps } from "@cronoslogistics/hive-tablepro/core/mui-base/src/utils";
import { Theme } from "@cronoslogistics/hive-tablepro/core/mui-material/src/styles";
import TextField, { TextFieldProps } from "@cronoslogistics/hive-tablepro/core/mui-material/src/TextField";
import { SxProps } from "@cronoslogistics/hive-tablepro/core/mui-system/src";
import * as React from 'react';
import type { UseFieldInternalProps } from '../hooks/useField';
;
;

export interface BaseFieldProps<TValue, TError>
  extends Omit<UseFieldInternalProps<TValue, TError>, 'format'> {
  className?: string;
  sx?: SxProps<Theme>;
  format?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  ref?: React.Ref<HTMLDivElement>;
  /**
   * @deprecated Please use `slots`.
   */
  components?: {
    TextField?: React.ElementType<TextFieldProps>;
  };
  /**
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: {
    textField?: SlotComponentProps<typeof TextField, {}, Record<string, any>>;
  };
  slots?: {
    textField?: React.ElementType<TextFieldProps>;
  };
  slotProps?: {
    textField?: SlotComponentProps<typeof TextField, {}, Record<string, any>>;
  };
}

export interface FieldsTextFieldProps
  extends Omit<
    TextFieldProps,
    | 'autoComplete'
    | 'error'
    | 'maxRows'
    | 'minRows'
    | 'multiline'
    | 'placeholder'
    | 'rows'
    | 'select'
    | 'SelectProps'
    | 'type'
  > { }

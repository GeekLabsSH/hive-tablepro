import { SlotComponentProps } from '@GeekLabsSH/hive-tablepro/core/mui-base/src/utils';
import Stack, { StackProps } from '@GeekLabsSH/hive-tablepro/core/mui-material/src/Stack';
import TextField, { TextFieldProps } from '@GeekLabsSH/hive-tablepro/core/mui-material/src/TextField';
import Typography, { TypographyProps } from '@GeekLabsSH/hive-tablepro/core/mui-material/src/Typography';
import {
  BaseFieldProps,
  FieldSection,
  UncapitalizeObjectKeys
} from '@GeekLabsSH/hive-tablepro/core/x-date-pickers/src/internals';
import * as React from 'react';

export interface RangeFieldSection extends FieldSection {
  dateName: 'start' | 'end';
}

export interface RangeFieldSectionWithoutPosition
  extends Omit<RangeFieldSection, 'start' | 'end' | 'startInInput' | 'endInInput'> { }

type BaseMultiInputFieldSlotsComponent = {
  Root?: React.ElementType<StackProps>;
  TextField?: React.ElementType<TextFieldProps>;
  Separator?: React.ElementType<TypographyProps>;
};

type BaseMultiInputFieldSlotsComponentsProps = {
  root?: SlotComponentProps<typeof Stack, {}, Record<string, any>>;
  textField?: SlotComponentProps<
    typeof TextField,
    {},
    { position?: 'start' | 'end' } & Record<string, any>
  >;
  separator?: SlotComponentProps<typeof Typography, {}, Record<string, any>>;
};

export interface BaseMultiInputFieldProps<TValue, TError>
  extends Omit<
    BaseFieldProps<TValue, TError>,
    'components' | 'componentsProps' | 'slots' | 'slotProps'
  > {
  /**
   * @deprecated Please use `slots`.
   */
  components?: BaseMultiInputFieldSlotsComponent;
  /**
   * @deprecated Please use `slotProps`.
   */
  componentsProps?: BaseMultiInputFieldSlotsComponentsProps;
  slots?: UncapitalizeObjectKeys<BaseMultiInputFieldSlotsComponent>;
  slotProps?: BaseMultiInputFieldSlotsComponentsProps;
}

import { SxProps } from '@GeekLabsSH/hive-tablepro/core/mui-system/src';
import * as React from 'react';
import { Theme } from '..';

export interface NativeSelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  disabled?: boolean;
  IconComponent: React.ElementType;
  inputRef?: React.Ref<HTMLSelectElement>;
  variant?: 'standard' | 'outlined' | 'filled';
  sx?: SxProps<Theme>;
}

declare const NativeSelectInput: React.JSXElementConstructor<NativeSelectInputProps>;

export default NativeSelectInput;

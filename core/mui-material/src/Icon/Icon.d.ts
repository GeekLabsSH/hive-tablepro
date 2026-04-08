import { SxProps } from '@GeekLabsSH/hive-tablepro/core/mui-system/src';
import { OverridableStringUnion } from '@GeekLabsSH/hive-tablepro/core/mui-types';
import * as React from 'react';
import { OverridableComponent, OverrideProps } from '../OverridableComponent';
import { Theme } from '../styles';
import { IconClasses } from './iconClasses';

export interface IconPropsSizeOverrides { }

export interface IconPropsColorOverrides { }

export interface IconTypeMap<P = {}, D extends React.ElementType = 'span'> {
  props: P & {
    /**
     * The base class applied to the icon. Defaults to 'material-icons', but can be changed to any
     * other base class that suits the icon font you're using (e.g. material-icons-rounded, fas, etc).
     * @default 'material-icons'
     */
    baseClassName?: string;
    /**
     * The name of the icon font ligature.
     */
    children?: React.ReactNode;
    /**
     * Override or extend the styles applied to the component.
     */
    classes?: Partial<IconClasses>;
    /**
     * The color of the component.
     * It supports both default and custom theme colors, which can be added as shown in the
     * [palette customization guide](https://mui.com/material-ui/customization/palette/#adding-new-colors).
     * @default 'inherit'
     */
    color?: OverridableStringUnion<
      | 'inherit'
      | 'action'
      | 'disabled'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning',
      IconPropsColorOverrides
    >;
    /**
     * The fontSize applied to the icon. Defaults to 24px, but can be configure to inherit font size.
     * @default 'medium'
     */
    fontSize?: OverridableStringUnion<
      'inherit' | 'large' | 'medium' | 'small',
      IconPropsSizeOverrides
    >;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps<Theme>;
  };
  defaultComponent: D;
}
/**
 *
 * Demos:
 *
 * - [Icons](https://mui.com/material-ui/icons/)
 * - [Material Icons](https://mui.com/material-ui/material-icons/)
 *
 * API:
 *
 * - [Icon API](https://mui.com/material-ui/api/icon/)
 */
declare const Icon: OverridableComponent<IconTypeMap> & { muiName: string };

export type IconProps<
  D extends React.ElementType = IconTypeMap['defaultComponent'],
  P = {},
> = OverrideProps<IconTypeMap<P, D>, D>;

export default Icon;

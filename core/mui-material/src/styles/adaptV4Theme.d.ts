import { BreakpointsOptions, ShapeOptions, SpacingOptions } from '@GeekLabsSH/hive-tablepro/core/mui-system/src';
import { MixinsOptions } from './createMixins';
import { Palette, PaletteOptions } from './createPalette';
import { Theme } from './createTheme';
import { TransitionsOptions } from './createTransitions';
import { TypographyOptions } from './createTypography';
import { ComponentsOverrides } from './overrides';
import { ComponentsProps } from './props';
import { Shadows } from './shadows';
import { ComponentsVariants } from './variants';
import { ZIndexOptions } from './zIndex';

export type Direction = 'ltr' | 'rtl';

export interface DeprecatedThemeOptions {
  shape?: ShapeOptions;
  breakpoints?: BreakpointsOptions;
  direction?: Direction;
  mixins?: MixinsOptions;
  overrides?: ComponentsOverrides;
  palette?: PaletteOptions;
  props?: ComponentsProps;
  shadows?: Shadows;
  spacing?: SpacingOptions;
  transitions?: TransitionsOptions;
  typography?: TypographyOptions | ((palette: Palette) => TypographyOptions);
  variants?: ComponentsVariants;
  zIndex?: ZIndexOptions;
  unstable_strictMode?: boolean;
}

/**
 * Generate a theme base on the V4 theme options received.
 * @deprecated Follow the upgrade guide on https://mui.com/r/migration-v4#theme
 * @param options Takes an incomplete theme object and adds the missing parts.
 * @returns A complete, ready-to-use theme object.
 */
export default function adaptV4Theme(options?: DeprecatedThemeOptions): Theme;

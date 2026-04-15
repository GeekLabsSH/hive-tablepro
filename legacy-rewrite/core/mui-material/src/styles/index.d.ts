export {
  alpha, Breakpoint,
  BreakpointOverrides,
  Breakpoints,
  BreakpointsOptions, ColorFormat,
  ColorObject, CreateMUIStyled, css, CSSInterpolation,
  CSSObject, darken, decomposeColor, Direction, emphasize, getContrastRatio,
  getLuminance,
  // color manipulators
  hexToRgb, hslToRgb, Interpolation, keyframes, lighten, recomposeColor, rgbToHex, StyledEngineProvider,
  SxProps
} from '@geeklabssh/hive-tablepro/core/mui-system/src';
export { default as adaptV4Theme, DeprecatedThemeOptions } from './adaptV4Theme';
export { Components } from './components';
export { Mixins } from './createMixins';
export {
  CommonColors,
  Palette,
  PaletteColor,
  PaletteColorOptions,
  PaletteOptions,
  SimplePaletteColorOptions, TypeAction,
  TypeBackground, TypeText
} from './createPalette';
export { default as createStyles } from './createStyles';
export {
  createMuiTheme, default as createTheme,
  default as unstable_createMuiStrictModeTheme, Theme, ThemeOptions
} from './createTheme';
export {
  Duration, duration, Easing, easing, Transitions,
  TransitionsOptions
} from './createTransitions';
export {
  default as private_createTypography, Typography as TypographyVariants,
  TypographyOptions as TypographyVariantsOptions,
  TypographyStyle,
  Variant as TypographyVariant
} from './createTypography';
export { getUnit as unstable_getUnit, toUnitless as unstable_toUnitless } from './cssUtils';
export * from './CssVarsProvider';
export { default as private_excludeVariablesFromRoot } from './excludeVariablesFromRoot';
export { default as experimental_extendTheme } from './experimental_extendTheme';
export type {
  ColorSchemeOverrides, ColorSystem, ColorSystemOptions, CssVarsPalette, CssVarsTheme, CssVarsThemeOptions, Opacity,
  Overlays, PaletteActionChannel, PaletteAlert, PaletteAppBar,
  PaletteAvatar,
  PaletteChip,
  PaletteColorChannel,
  PaletteCommonChannel,
  PaletteFilledInput,
  PaletteLinearProgress,
  PaletteSkeleton,
  PaletteSlider,
  PaletteSnackbarContent,
  PaletteSpeedDialAction,
  PaletteStepConnector,
  PaletteStepContent,
  PaletteSwitch,
  PaletteTableCell,
  PaletteTextChannel,
  PaletteTooltip, SupportedColorScheme, ThemeCssVar,
  ThemeCssVarOverrides, ThemeVars
} from './experimental_extendTheme';
export { default as getOverlayAlpha } from './getOverlayAlpha';
export { default as makeStyles } from './makeStyles';
export { ComponentNameToClassKey, ComponentsOverrides } from './overrides';
export { ComponentsProps, ComponentsPropsList } from './props';
export { default as responsiveFontSizes } from './responsiveFontSizes';
export { Shadows } from './shadows';
export { default as experimentalStyled, default as styled } from './styled';
export { default as ThemeProvider } from './ThemeProvider';
export { default as useTheme } from './useTheme';
export * from './useThemeProps';
export { default as useThemeProps } from './useThemeProps';
export { ComponentsVariants } from './variants';
export { default as withStyles } from './withStyles';
export { default as withTheme } from './withTheme';
export { ZIndex } from './zIndex';
// TODO: Remove this function in v6.
// eslint-disable-next-line @typescript-eslint/naming-convention
export function experimental_sx(): any;

export type ClassNameMap<ClassKey extends string = string> = Record<ClassKey, string>;

export interface StyledComponentProps<ClassKey extends string = string> {
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: Partial<ClassNameMap<ClassKey>>;
}






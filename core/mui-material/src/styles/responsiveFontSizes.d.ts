import { Breakpoint } from '@GeekLabsSH/hive-tablepro/core/mui-system/src';
import { Theme } from './createTheme';
import { Typography } from './createTypography';

export interface ResponsiveFontSizesOptions {
  breakpoints?: Breakpoint[];
  disableAlign?: boolean;
  factor?: number;
  variants?: Array<keyof Typography>;
}

export default function responsiveFontSizes(
  theme: Theme,
  options?: ResponsiveFontSizesOptions,
): Theme;

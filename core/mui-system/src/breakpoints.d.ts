import { CSSObject } from '@geeklabssh/hive-tablepro/core/mui-styled-engine/src';
import type { Breakpoint } from './createTheme';
import { Breakpoints } from './createTheme/createBreakpoints';
import { ResponsiveStyleValue } from './styleFunctionSx';

export interface ResolveBreakpointValuesOptions<T> {
  values: ResponsiveStyleValue<T>;
  breakpoints?: Breakpoints['values'];
  base?: Record<string, boolean>;
}
export function resolveBreakpointValues<T>(
  options: ResolveBreakpointValuesOptions<T>,
): Record<string, T>;

export function mergeBreakpointsInOrder(breakpoints: Breakpoints, styles: any[]): any;

export function handleBreakpoints<Props>(
  props: Props,
  propValue: any,
  styleFromPropValue: (value: any, breakpoint?: Breakpoint) => any,
): any;

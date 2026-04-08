import { Breakpoint } from '@GeekLabsSH/hive-tablepro/core/mui-system/src';
import * as React from 'react';

export interface HiddenCssProps {
  lgDown?: boolean;
  lgUp?: boolean;
  mdDown?: boolean;
  mdUp?: boolean;
  only?: Breakpoint | Breakpoint[];
  smDown?: boolean;
  smUp?: boolean;
  xlDown?: boolean;
  xlUp?: boolean;
  xsDown?: boolean;
  xsUp?: boolean;
}

declare const HiddenCss: React.JSXElementConstructor<HiddenCssProps>;

export default HiddenCss;

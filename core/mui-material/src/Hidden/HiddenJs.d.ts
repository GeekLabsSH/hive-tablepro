import { Breakpoint } from '@geeklabssh/hive-tablepro/core/mui-system/src';
import * as React from 'react';

export interface HiddenJsProps {
  width?: Breakpoint;
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

declare const HiddenJs: React.JSXElementConstructor<HiddenJsProps>;

export default HiddenJs;

import { Interpolation } from '@geeklabssh/hive-tablepro/core/mui-system/src';
import { Theme } from './createTheme';
import { ComponentsPropsList } from './props';

export type ComponentsVariants = {
  [Name in keyof ComponentsPropsList]?: Array<{
    props: Partial<ComponentsPropsList[Name]>;
    style: Interpolation<{ theme: Theme }>;
  }>;
};

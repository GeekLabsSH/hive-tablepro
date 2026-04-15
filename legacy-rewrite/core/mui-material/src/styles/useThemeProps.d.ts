import { Components } from './components';
import { Theme } from './createTheme';

export interface ThemeWithProps {
  components?: Components<Omit<Theme, 'components'>>;
}

export type ThemedProps<Theme, Name extends keyof any> = Theme extends {
  components: Record<Name, { defaultProps: infer Props }>;
}
  ? Props
  : {};

export default function useThemeProps(params: any): Props & ThemedProps<Theme, Name>;

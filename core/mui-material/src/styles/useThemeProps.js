import { useThemeProps as systemUseThemeProps } from "@GeekLabsSH/hive-tablepro/core/mui-system/src";
import defaultTheme from "./defaultTheme";

export default function useThemeProps({ props, name }) {
  return systemUseThemeProps({ props, name, defaultTheme });
}

import { useTheme as muiUseTheme } from "@cronoslogistics/hive-tablepro/core/mui-private-theming/src";

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function useTheme(defaultTheme = null) {
  const contextTheme = muiUseTheme();
  return !contextTheme || isObjectEmpty(contextTheme)
    ? defaultTheme
    : contextTheme;
}

export default useTheme;

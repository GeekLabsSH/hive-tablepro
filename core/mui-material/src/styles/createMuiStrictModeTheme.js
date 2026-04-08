import { deepmerge } from "@cronoslogistics/hive-tablepro/core/mui-utils/src";
import createTheme from "./createTheme";

export default function createMuiStrictModeTheme(options, ...args) {
  return createTheme(
    deepmerge(
      {
        unstable_strictMode: true,
      },
      options
    ),
    ...args
  );
}

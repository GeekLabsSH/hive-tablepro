import { deepmerge } from "@geeklabssh/hive-tablepro/core/mui-utils/src";
import defaultSxConfig from "../styleFunctionSx/defaultSxConfig";
import styleFunctionSx from "../styleFunctionSx/styleFunctionSx";
import createBreakpoints from "./createBreakpoints";
import createSpacing from "./createSpacing";
import shape from "./shape";

function createTheme(options = {}, ...args) {
  const {
    breakpoints: breakpointsInput = {},
    palette: paletteInput = {},
    spacing: spacingInput,
    shape: shapeInput = {},
    ...other
  } = options;

  const breakpoints = createBreakpoints(breakpointsInput);
  const spacing = createSpacing(spacingInput);

  let muiTheme = deepmerge(
    {
      breakpoints,
      direction: "ltr",
      components: {}, // Inject component definitions.
      palette: { mode: "light", ...paletteInput },
      spacing,
      shape: { ...shape, ...shapeInput },
    },
    other
  );

  muiTheme = args.reduce((acc, argument) => deepmerge(acc, argument), muiTheme);

  muiTheme.unstable_sxConfig = {
    ...defaultSxConfig,
    ...other?.unstable_sxConfig,
  };
  muiTheme.unstable_sx = function sx(props) {
    return styleFunctionSx({
      sx: props,
      theme: this,
    });
  };

  return muiTheme;
}

export default createTheme;

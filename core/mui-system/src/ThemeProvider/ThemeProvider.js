import { ThemeProvider as MuiThemeProvider } from "@GeekLabsSH/hive-tablepro/core/mui-private-theming/src";
import { ThemeContext as StyledEngineThemeContext } from "@GeekLabsSH/hive-tablepro/core/mui-styled-engine/src";
import { exactProp } from "@GeekLabsSH/hive-tablepro/core/mui-utils/src";
import PropTypes from "prop-types";
import useTheme from "../useTheme";

const EMPTY_THEME = {};

function InnerThemeProvider(props) {
  const theme = useTheme();
  return (
    <StyledEngineThemeContext.Provider
      value={typeof theme === "object" ? theme : EMPTY_THEME}
    >
      {props.children}
    </StyledEngineThemeContext.Provider>
  );
}

InnerThemeProvider.propTypes = {
  /**
   * Your component tree.
   */
  children: PropTypes.node,
};

/**
 * This component makes the `theme` available down the React tree.
 * It should preferably be used at **the root of your component tree**.
 */
function ThemeProvider(props) {
  const { children, theme: localTheme } = props;

  return (
    <MuiThemeProvider theme={localTheme}>
      <InnerThemeProvider>{children}</InnerThemeProvider>
    </MuiThemeProvider>
  );
}

ThemeProvider.propTypes /* remove-proptypes */ = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // |     To update them edit the d.ts file and run "yarn proptypes"     |
  // ----------------------------------------------------------------------
  /**
   * Your component tree.
   */
  children: PropTypes.node,
  /**
   * A theme object. You can provide a function to extend the outer theme.
   */
  theme: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
};

if (process.env.NODE_ENV !== null) {
  ThemeProvider.propTypes = exactProp(ThemeProvider.propTypes);
}

export default ThemeProvider;

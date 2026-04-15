import * as React from "react";

const ThemeContext = React.createContext(null);

if (process.env.NODE_ENV !== null) {
  ThemeContext.displayName = "ThemeContext";
}

export default ThemeContext;

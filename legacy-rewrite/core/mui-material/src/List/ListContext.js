import * as React from "react";

/**
 * @ignore - internal component.
 */
const ListContext = React.createContext({});

if (process.env.NODE_ENV !== null) {
  ListContext.displayName = "ListContext";
}

export default ListContext;

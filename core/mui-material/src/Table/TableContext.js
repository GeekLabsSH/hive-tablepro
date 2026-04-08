import * as React from "react";

/**
 * @ignore - internal component.
 */
const TableContext = React.createContext();

if (process.env.NODE_ENV !== null) {
  TableContext.displayName = "TableContext";
}

export default TableContext;

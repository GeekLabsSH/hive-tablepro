import * as React from 'react';

const GridRootPropsContext = React.createContext<unknown>(undefined);

if (process.env.NODE_ENV !== null) {
  GridRootPropsContext.displayName = 'GridRootPropsContext';
}

export { GridRootPropsContext };

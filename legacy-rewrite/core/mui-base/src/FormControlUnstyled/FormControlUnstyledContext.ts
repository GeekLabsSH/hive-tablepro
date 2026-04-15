import * as React from 'react';
import { FormControlUnstyledState } from './FormControlUnstyled.types';

/**
 * @ignore - internal component.
 */
const FormControlUnstyledContext = React.createContext<FormControlUnstyledState | undefined>(
  undefined,
);

FormControlUnstyledContext.displayName = 'FormControlUnstyledContext';

export default FormControlUnstyledContext;

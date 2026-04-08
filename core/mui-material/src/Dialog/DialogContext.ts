import { createContext } from 'react';

interface DialogContextValue {
  titleId?: string;
}

const DialogContext = createContext<DialogContextValue>({});

if (process.env.NODE_ENV !== null) {
  DialogContext.displayName = 'DialogContext';
}

export default DialogContext;

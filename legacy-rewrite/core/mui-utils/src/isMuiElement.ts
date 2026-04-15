import * as React from 'react';

export default function isMuiElement(element: any, muiNames: readonly string[]): boolean {
  return React.isValidElement(element as any) && muiNames.indexOf((element.type as any).muiName) !== -1;
}

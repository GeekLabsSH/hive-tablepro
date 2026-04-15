import * as React from "react";

/** Sem tema MUI: apenas repassa filhos (CSS do consumidor / Tailwind). */
export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

/** Sem reset global MUI; o consumidor importa estilos próprios. */
export function CssBaseline() {
  return null;
}

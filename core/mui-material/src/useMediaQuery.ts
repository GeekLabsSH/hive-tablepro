import * as React from "react";

/**
 * Subconjunto do `useMediaQuery` do MUI: devolve se a media query corresponde (cliente).
 */
export function useMediaQuery(query: string): boolean {
  const get = React.useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = React.useState(get);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      return undefined;
    }
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    setMatches(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

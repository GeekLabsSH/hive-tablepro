import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * Ambiente jsdom: Radix / medidas de layout usam estas APIs (inexistentes no Node por defeito).
 * Em testes `environment: node` não há `window` — o bloco não corre.
 */
if (typeof window !== "undefined") {
  class ResizeObserverMock {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- polyfill global
  (window as any).ResizeObserver = ResizeObserverMock;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}

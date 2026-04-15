/**
 * @vitest-environment jsdom
 */
import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GridErrorBoundary } from "./GridErrorBoundary";

function ThrowWhen({ fail }: { fail: boolean }) {
  if (fail) throw new Error("grid-render-boom");
  return <div>ok</div>;
}

describe("GridErrorBoundary", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza filhos quando não há erro", () => {
    render(
      <GridErrorBoundary>
        <ThrowWhen fail={false} />
      </GridErrorBoundary>
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("mostra fallback por defeito quando há erro", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <GridErrorBoundary>
        <ThrowWhen fail />
      </GridErrorBoundary>
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro ao renderizar a grelha/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it("após corrigir a causa, «Tentar novamente» repõe os filhos", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Harness() {
      const [fail, setFail] = React.useState(true);
      return (
        <>
          <GridErrorBoundary>
            {fail ? <ThrowWhen fail /> : <ThrowWhen fail={false} />}
          </GridErrorBoundary>
          <button type="button" onClick={() => setFail(false)}>
            repair
          </button>
        </>
      );
    }

    render(<Harness />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^repair$/i }));
    await user.click(screen.getByRole("button", { name: /Tentar novamente/i }));

    expect(screen.getByText("ok")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("chama onError em componentDidCatch", () => {
    const onError = vi.fn();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <GridErrorBoundary onError={onError}>
        <ThrowWhen fail />
      </GridErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0]![0] as Error).message).toBe("grid-render-boom");

    spy.mockRestore();
  });
});

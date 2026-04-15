import * as React from "react";

export type GridErrorBoundaryFallbackRender = (
  error: Error,
  reset: () => void
) => React.ReactNode;

export interface GridErrorBoundaryProps {
  children: React.ReactNode;
  /** UI alternativa; função recebe o erro e `reset` para voltar a tentar renderizar os filhos. */
  fallback?: React.ReactNode | GridErrorBoundaryFallbackRender;
  /** Observabilidade (ex.: enviar para serviço de erros). */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Texto do botão «tentar novamente» no fallback por defeito. */
  retryLabel?: string;
  /** Mensagem no fallback por defeito (quando `fallback` não é passado). */
  title?: string;
}

interface State {
  error: Error | null;
}

/**
 * Boundary de erro para envolver `DataGrid` (ou árvore próxima) e evitar que uma exceção de render
 * derrube toda a página. Não substitui tratamento de erros em `processRowUpdate` ou pedidos à API.
 */
export class GridErrorBoundary extends React.Component<GridErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      const { fallback, retryLabel, title } = this.props;
      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }
      if (fallback != null) {
        return fallback;
      }
      return (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p>{title ?? "Ocorreu um erro ao renderizar a grelha."}</p>
          <button
            type="button"
            className="mt-2 text-left font-medium underline underline-offset-2"
            onClick={this.reset}
          >
            {retryLabel ?? "Tentar novamente"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const RELOAD_KEY = "app_chunk_reload_at";

export const isChunkLoadError = (error: unknown): boolean => {
  const msg = String((error as Error)?.message || error || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk/i.test(msg);
};

/** Recarrega a página uma única vez a cada 30s quando uma versão nova foi publicada. */
export const reloadOnceForNewVersion = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  window.location.reload();
  return true;
};

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[AppErrorBoundary]", error);
    if (isChunkLoadError(error)) reloadOnceForNewVersion();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo deu errado ao exibir esta tela</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Suas conversas e dados estão preservados. Recarregue para continuar.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
          <Button variant="outline" onClick={() => this.setState({ error: null })}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }
}

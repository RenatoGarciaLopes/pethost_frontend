import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { ThemeProviders } from "./ThemeProviders";

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Todos os providers do app, em ordem fixa: tema por fora (o fallback de erro também é estilizado)
 * e TanStack Query por dentro. Usado uma vez, no `app/layout.tsx`.
 *
 * @example <AppProviders>{children}</AppProviders>
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProviders>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProviders>
  );
}

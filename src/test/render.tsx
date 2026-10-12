import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider, type Theme } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";

/**
 * QueryClient para testes: sem retry (falha aparece na hora) e sem refetch automático.
 * Use quando o teste precisar semear o cache antes do render.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Tema MUI. Padrão: tema base do MUI até a spec 002 entregar o tema Quintal. */
  theme?: Theme;
  /** QueryClient a usar. Padrão: um novo por render (`createTestQueryClient`). */
  queryClient?: QueryClient;
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
  user: UserEvent;
}

/**
 * Renderiza com os providers da aplicação, isolados por teste (spec 001, REQ-TOOL-003):
 * cache Emotion próprio, tema MUI, `CssBaseline` e QueryClient novo.
 *
 * **Quando usar:** em todo teste de componente ou hook que dependa de tema ou de TanStack Query.
 * **Quando não usar:** em lógica pura (`lib`, mappers, schemas), que não precisa de DOM.
 *
 * @example
 * const { user } = renderWithProviders(<LoginForm />);
 * await user.click(screen.getByRole("button", { name: "Entrar" }));
 */
export function renderWithProviders(
  ui: ReactElement,
  { theme = createTheme(), queryClient = createTestQueryClient(), ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const emotionCache = createCache({ key: "test", prepend: true });

  function Providers({ children }: { children: ReactNode }) {
    return (
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ThemeProvider>
      </CacheProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Providers, ...options }),
    queryClient,
    user: userEvent.setup(),
  };
}

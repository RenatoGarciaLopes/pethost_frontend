import type { ReactNode } from "react";
import { FlashMessageProvider } from "@/shared/hooks/useFlashMessage";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { MotionProvider } from "./MotionProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProviders } from "./ThemeProviders";

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Todos os providers do app, em ordem fixa: tema por fora (o fallback de erro também é estilizado),
 * Motion (respeita o movimento reduzido), TanStack Query, a região viva do app (`AnnouncerProvider`) e o aviso que atravessa uma navegação (`FlashMessageProvider`) por dentro. Usado uma vez, no `app/layout.tsx`.
 *
 * @example <AppProviders>{children}</AppProviders>
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProviders>
      <MotionProvider>
        <QueryProvider>
          <AnnouncerProvider>
            <FlashMessageProvider>{children}</FlashMessageProvider>
          </AnnouncerProvider>
        </QueryProvider>
      </MotionProvider>
    </ThemeProviders>
  );
}

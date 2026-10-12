"use client";
import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { quintalTheme } from "../../../shared/theme/createQuintalTheme";

/** Props of the theme boundary; independent of auth/query providers. */
export interface ThemeProvidersProps {
  /** App content receiving Quintal and streamed Emotion styles. */
  children: ReactNode;
}
/**
 * Applies Quintal, baseline and the MUI Next 16 SSR cache. Use once in the root layout;
 * isolated tests should use renderWithProviders with quintalTheme.
 * @example <ThemeProviders>{children}</ThemeProviders>
 */
export function ThemeProviders({ children }: ThemeProvidersProps) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={quintalTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

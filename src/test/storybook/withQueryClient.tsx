import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Decorator } from "@storybook/nextjs-vite";

/** Decorator para stories de componentes que usam TanStack Query: cliente novo, sem retentativa. @example decorators: [withQueryClient] */
export const withQueryClient: Decorator = (Story) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Story />
  </QueryClientProvider>
);

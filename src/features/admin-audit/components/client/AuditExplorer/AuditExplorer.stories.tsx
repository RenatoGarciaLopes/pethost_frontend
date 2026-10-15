import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { useState } from "react";
import { fn } from "storybook/test";
import { auditQueries } from "../../../api/queries";
import { auditPageModelFixture } from "@/test/fixtures/audit";
import { AuditExplorer } from "./AuditExplorer";

function Frame({ empty }: { empty: boolean }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      auditQueries.page("admin-story", { page: 1, pageSize: 20 }).queryKey,
      auditPageModelFixture(empty ? [] : undefined),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <AuditExplorer accountId="admin-story" initialInvalidFilters={[]} />
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/AdminAudit/Explorer",
  component: Frame,
  args: { empty: false },
  beforeEach: () => {
    usePathname.mockReturnValue("/admin/audit-entries");
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), replace: fn() } as never);
    useSearchParams.mockReturnValue(new URLSearchParams("") as never);
  },
  parameters: { design: { board: "Admin-Auditoria", section: "Busca completa" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ComRegistros: Story = {};
export const Vazia: Story = { args: { empty: true } };

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { useState } from "react";
import { fn } from "storybook/test";
import { auditQueries } from "../../../api/queries";
import { auditPageModelFixture } from "@/test/fixtures/audit";
import type { AuditSearch } from "../../../schemas/auditSearchSchema";
import { AuditTable } from "./AuditTable";

function Frame({ variant }: { variant: "full" | "compact" }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    const filters = {
      page: 1,
      pageSize: variant === "compact" ? 10 : 20,
      ...(variant === "compact" ? { targetType: "owner", targetId: "15d2c8a8-8f67-44f7-8eb3-4ecf56c65e83" } : {}),
    };
    queryClient.setQueryData(auditQueries.page("audit-story", filters).queryKey, auditPageModelFixture());
    return queryClient;
  });
  const filters: AuditSearch = { page: 1, pageSize: 20 };
  return (
    <QueryClientProvider client={client}>
      <AuditTable
        adminId="audit-story"
        filters={filters}
        onFiltersChange={fn()}
        variant={variant}
        fixedFilters={
          variant === "compact" ? { targetType: "owner", targetId: "15d2c8a8-8f67-44f7-8eb3-4ecf56c65e83" } : undefined
        }
      />
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/AdminAudit/Tabela",
  component: Frame,
  args: { variant: "full" },
  beforeEach: () => {
    usePathname.mockReturnValue("/admin/audit-entries");
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), replace: fn() } as never);
    useSearchParams.mockReturnValue(new URLSearchParams("") as never);
  },
  parameters: { design: { board: "Admin-Auditoria", section: "Tabela e paginação" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Completa: Story = {};
export const Compacta: Story = { args: { variant: "compact" } };

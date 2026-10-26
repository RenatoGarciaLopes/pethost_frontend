import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { useState } from "react";
import { fn } from "storybook/test";
import { AuditTable } from "@/features/admin-audit/index.client";
import { auditQueries } from "@/features/admin-audit";
import { adminOwnerQueries } from "@/features/owners";
import { auditEntryFixture, auditPageModelFixture } from "@/test/fixtures/audit";
import { adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { AccountDetail } from "@/widgets/admin-accounts/index.client";

const adminId = "0199d2a0-0000-7000-8000-000000004299";
const owner = adminOwnerFixture();
const targetPath = `/admin/users/owners/${owner.id}`;

function OwnerAccountWithAudit() {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(adminOwnerQueries.detail(adminId, owner.id).queryKey, owner);
    const filters = { page: 1, pageSize: 10, targetType: "owner", targetId: owner.id };
    queryClient.setQueryData(
      auditQueries.page(adminId, filters).queryKey,
      auditPageModelFixture([auditEntryFixture({ targetId: owner.id, reason: "Revisão sintética da conta" })]),
    );
    return queryClient;
  });

  return (
    <QueryClientProvider client={client}>
      <AccountDetail
        accountId={adminId}
        kind="owners"
        resourceId={owner.id}
        auditTrail={
          <AuditTable adminId={adminId} fixedFilters={{ targetType: "owner", targetId: owner.id }} variant="compact" />
        }
      />
    </QueryClientProvider>
  );
}

const meta = {
  title: "Admin/Accounts/Composição com trilha",
  component: OwnerAccountWithAudit,
  beforeEach: () => {
    usePathname.mockReturnValue(targetPath);
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), replace: fn() } as never);
    useSearchParams.mockReturnValue(new URLSearchParams("") as never);
  },
  parameters: { design: { board: "Admin-Contas", section: "Detalhe com trilha compacta" } },
} satisfies Meta<typeof OwnerAccountWithAudit>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Composição no nível app: o detalhe 032 recebe AuditTable sem dependência entre features. */
export const TutorComTrilha: Story = {};

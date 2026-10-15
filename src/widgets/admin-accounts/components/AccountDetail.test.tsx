import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { adminHostQueries } from "@/features/hosts";
import { adminOwnerQueries } from "@/features/owners";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AccountDetail } from "./AccountDetail";

const adminId = "0199d2a0-0000-7000-8000-000000004299";

it.each([
  {
    kind: "owners" as const,
    targetType: "owner",
    source: adminOwnerFixture(),
    queries: adminOwnerQueries,
  },
  {
    kind: "hosts" as const,
    targetType: "host",
    source: adminHostFixture(),
    queries: adminHostQueries,
  },
])(
  "REQ-AACC-012 $targetType shows the composed audit slot and filtered trail link",
  ({ kind, targetType, source, queries }) => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queries.detail(adminId, source.id).queryKey, source);

    renderWithProviders(
      <AccountDetail
        accountId={adminId}
        resourceId={source.id}
        kind={kind}
        auditTrail={<div>Evento recente da trilha</div>}
      />,
      { queryClient, theme: quintalTheme },
    );

    const trail = screen.getByRole("region", { name: "Trilha da conta" });
    expect(within(trail).getByText("Evento recente da trilha")).toBeVisible();
    expect(within(trail).getByRole("link", { name: "Ver na trilha" })).toHaveAttribute(
      "href",
      `/admin/audit-entries?targetType=${targetType}&targetId=${source.id}`,
    );
  },
);

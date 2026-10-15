import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { adminApplicationQueries, type AdminApplication } from "@/features/admin-host-applications";
import { HostApplicationReview } from "./HostApplicationReview";
import { Notice } from "@/shared/ui/feedback/Notice";
import { adminReviewCopy } from "@/features/admin-host-applications";
function ReviewStory({ application }: { application: AdminApplication }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    queryClient.setQueryData(adminApplicationQueries.detail("story-admin", application.id).queryKey, application);
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <HostApplicationReview accountId="story-admin" applicationId={application.id} />
    </QueryClientProvider>
  );
}
const meta = {
  title: "Admin/HostApplicationReview",
  component: ReviewStory,
  parameters: { design: { board: "Fluxo-Admin", label: "Conferir e decidir" } },
  args: { application: adminApplicationFixture() },
} satisfies Meta<typeof ReviewStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EmAnalise: Story = {};
export const Decidida: Story = {
  args: {
    application: adminApplicationFixture({
      status: "approved",
      reviewNotes: "Dados conferidos",
      reviewedAt: "2026-10-02T12:00:00Z",
      reviewedBy: "0199d2a0-0000-7000-8000-000000000099",
    }),
  },
};
export const FotosApagadas: Story = {
  args: { application: adminApplicationFixture({ status: "rejected", documentsPurgedAt: "2026-10-03T12:00:00Z" }) },
};
export const Empresa: Story = {
  args: {
    application: adminApplicationFixture({
      personType: "pj",
      company: {
        cnpj: "11222333000181",
        legalName: "Empresa de teste",
        tradeName: "Casa de teste",
        address: { city: "Maringá", state: "PR" },
      },
    }),
  },
};
export const Celular: Story = { globals: { viewport: { value: "celular" } } };
export const Conflito: Story = {
  args: {
    application: adminApplicationFixture({
      status: "rejected",
      rejectionReason: "other",
      reviewNotes: "Outra decisão registrada",
    }),
  },
  render: (args) => (
    <>
      <Notice tone="info" title={adminReviewCopy.conflict} />
      <ReviewStory {...args} />
    </>
  ),
};

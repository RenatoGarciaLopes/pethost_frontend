import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { AppShell } from "./AppShell";

/** Cache isolado, como nas stories de AddressFields, sem chamadas ao backend. */
function Frame({ role }: { role: "owner" | "host" | "admin" }) {
  const [client] = useState(() => {
    const cache = new QueryClient();
    cache.setQueryData(accountQueryKey("story-account", "linked-accounts"), [
      { role: "owner", isActive: true, isCurrent: role === "owner" },
      { role: "host", isActive: true, isCurrent: role === "host" },
    ]);
    return cache;
  });
  return (
    <QueryClientProvider client={client}>
      <AppShell
        user={{ id: "story-account", fullName: "Camila Souza", email: "camila@exemplo.test", role, isActive: true }}
      >
        <Box sx={{ p: 3 }}>
          <Typography component="h1" variant="h4">
            Seu cantinho
          </Typography>
          <Typography>O conteúdo da página fica dentro da casca.</Typography>
        </Box>
      </AppShell>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Widgets/AppShell",
  component: Frame,
  tags: ["autodocs"],
  // O decorator App Router do Storybook ainda usa o LayoutRouterContext anterior ao Next 16.4.
  // Reaproveita o router do framework e seu mock de next/navigation, sem simular hooks do widget.
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "story" });
  },
  args: { role: "owner" },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tutor: Story = {
  name: "REQ-SHELL-001/003/004 Tutor",
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "CS Menu da conta de Camila Souza" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByText("Conta de tutor")).toBeVisible());
    await expect(body.getByRole("menuitem", { name: "Trocar pra conta de anfitrião" })).toHaveAttribute(
      "href",
      "/users/switch?to=host",
    );
    await userEvent.keyboard("{Escape}");
  },
};

export const Anfitriao: Story = {
  name: "REQ-SHELL-001/003 Anfitrião",
  args: { role: "host" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "CS Menu da conta de Camila Souza" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByText("Conta de anfitrião")).toBeVisible());
    await expect(body.getByRole("menuitem", { name: "Trocar pra conta de tutor" })).toBeVisible();
  },
};

export const Admin: Story = {
  name: "REQ-SHELL-001/011 Admin",
  args: { role: "admin" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "CS Menu da conta de Camila Souza" }));
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByText("Conta de admin")).toBeVisible());
    await expect(body.queryByRole("menuitem", { name: "Minha conta" })).not.toBeInTheDocument();
    await expect(body.queryByRole("menuitem", { name: /Trocar pra/ })).not.toBeInTheDocument();
    await expect(body.getByRole("menuitem", { name: "Sair" })).toBeVisible();
  },
};

export const Celular: Story = {
  name: "REQ-SHELL-007 Celular (390 px)",
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const skip = canvas.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toHaveFocus();
    // O mock de router do Storybook segura a navegação por âncora; o foco no main é provado no E2E (shell.spec.ts).
    await expect(skip).toHaveAttribute("href", "#conteudo");
    await expect(canvas.getByRole("main")).toHaveAttribute("id", "conteudo");
  },
};

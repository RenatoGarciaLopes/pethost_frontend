import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { usePathname, useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { accountProfileFixture } from "@/test/fixtures/account";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { AccountSettingsLayout } from "./AccountSettingsLayout";
import { ProfileEditor } from "./client/ProfileEditor";
import { PasswordChangeForm } from "./client/PasswordChangeForm";
import { DeactivateForm } from "./client/DeactivateForm";

function Frame({ view }: { view: "profile" | "password" | "deactivate" }) {
  const [client] = useState(() => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    // No address lookup in a visual fixture; CEP behavior remains covered by integration tests.
    cache.setQueryData(accountQueryKey("story", "profile"), { ...accountProfileFixture, address: null });
    return cache;
  });
  return (
    <QueryClientProvider client={client}>
      <main>
        <AccountSettingsLayout>
          {view === "profile" ? (
            <PageContainer width="page">
              <ProfileEditor userId="story" role="owner" />
            </PageContainer>
          ) : view === "password" ? (
            <PasswordChangeForm role="owner" />
          ) : (
            <DeactivateForm role="owner" />
          )}
        </AccountSettingsLayout>
      </main>
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/Account/Settings",
  component: Frame,
  args: { view: "profile" },
  parameters: { layout: "fullscreen" },
  beforeEach: ({ args }) => {
    usePathname.mockReturnValue(`/users/${args.view}`);
    useRouter.mockReturnValue({ ...getRouter(), replace: fn(), refresh: fn(), bfcacheId: "story" });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1 })).toBeVisible();
    await expect(canvas.getByRole("navigation")).toBeVisible();
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Perfil: Story = { globals: { viewport: { value: "desktop" } } };
export const PerfilCelular: Story = { globals: { viewport: { value: "celular" } } };
export const Senha: Story = { args: { view: "password" } };
export const SenhaCelular: Story = { args: { view: "password" }, globals: { viewport: { value: "celular" } } };
export const Pausar: Story = { args: { view: "deactivate" } };
export const PausarCelular: Story = { args: { view: "deactivate" }, globals: { viewport: { value: "celular" } } };

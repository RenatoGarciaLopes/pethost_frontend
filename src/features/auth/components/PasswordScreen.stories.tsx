import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { accountQueryKey } from "@/shared/api/query/queryClient";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { AccountSwitchPanel } from "./client/AccountSwitchPanel";
import { ForgotPasswordFlow } from "./client/ForgotPasswordFlow";
import { ResetPasswordFlow } from "./client/ResetPasswordFlow";
import { ResetPasswordForm } from "./client/ResetPasswordForm";
import { PasswordScreen } from "./PasswordScreen";

function Frame({ view }: { view: "forgot" | "missing" | "reset" | "switch" }) {
  const [client] = useState(() => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
    cache.setQueryData(accountQueryKey("story", "linked-accounts"), [
      { role: "owner", isActive: true, isCurrent: true },
      { role: "host", isActive: true, isCurrent: false },
    ]);
    return cache;
  });
  return (
    <QueryClientProvider client={client}>
      <AnnouncerProvider>
        <PasswordScreen>
          {view === "forgot" ? (
            <ForgotPasswordFlow initialRole="owner" />
          ) : view === "missing" ? (
            <ResetPasswordFlow />
          ) : view === "reset" ? (
            <ResetPasswordForm token="synthetic-story-token" onDone={fn()} onTokenRejected={fn()} />
          ) : (
            <AccountSwitchPanel userId="story" current="owner" target="host" />
          )}
        </PasswordScreen>
      </AnnouncerProvider>
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/Auth/PasswordScreen",
  component: Frame,
  args: { view: "forgot" },
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), replace: fn(), refresh: fn(), bfcacheId: "story" });
  },
  play: async ({ canvasElement }) => {
    // Audit the settled view, not the intermediate opacity of Reveal.
    await waitFor(() => {
      const reveals = [...canvasElement.querySelectorAll<HTMLElement>("div[style]")].filter((element) => element.style.opacity !== "" && element.getClientRects().length > 0);
      for (const element of reveals) expect(getComputedStyle(element).opacity).toBe("1");
    }, { timeout: 5000 });
    await expect(await within(canvasElement).findByRole("heading", { level: 1 })).toBeVisible();
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Recuperar: Story = {};
export const RecuperarCelular: Story = { globals: { viewport: { value: "celular" } } };
export const LinkIncompleto: Story = { args: { view: "missing" } };
export const NovaSenha: Story = { args: { view: "reset" } };
export const TrocarConta: Story = { args: { view: "switch" } };
export const TrocarContaCelular: Story = { args: { view: "switch" }, globals: { viewport: { value: "celular" } } };

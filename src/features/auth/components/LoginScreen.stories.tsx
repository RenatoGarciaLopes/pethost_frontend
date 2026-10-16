import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, fn, waitFor, within } from "storybook/test";
import { LoginScreen, type LoginScreenProps } from "./LoginScreen";

function Frame(props: LoginScreenProps) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <LoginScreen {...props} />
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/Auth/LoginScreen",
  component: Frame,
  args: { variant: "account", initialRole: "owner", next: null },
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
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(canvas.getByRole("textbox", { name: /^E-mail/ })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Entrar" })).toBeEnabled();
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = { globals: { viewport: { value: "desktop" } } };
export const TutorCelular: Story = { globals: { viewport: { value: "celular" } } };
export const Equipe: Story = { args: { variant: "admin", initialRole: "admin" } };
export const EquipeCelular: Story = {
  args: { variant: "admin", initialRole: "admin" },
  globals: { viewport: { value: "celular" } },
};

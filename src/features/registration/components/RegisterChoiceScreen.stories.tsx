import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import { RegisterChoiceScreen } from "./RegisterChoiceScreen";
const meta = {
  title: "Features/Registration/Choice",
  component: RegisterChoiceScreen,
  args: { next: null },
  parameters: { layout: "fullscreen" },
  play: async ({ canvasElement, userEvent }) => {
    // Audit the settled view, not the intermediate opacity of Reveal.
    await waitFor(() => {
      const reveals = [...canvasElement.querySelectorAll<HTMLElement>("div[style]")].filter((element) => element.style.opacity !== "" && element.getClientRects().length > 0);
      for (const element of reveals) expect(getComputedStyle(element).opacity).toBe("1");
    }, { timeout: 5000 });
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toBeVisible();
    const options = canvas.getAllByRole("radio");
    await userEvent.click(options[0]!);
    await expect(options[0]!).toBeChecked();
    await expect(canvas.getByRole("link", { name: /Continuar/ })).toHaveAttribute("href", "/register/owner");
  },
} satisfies Meta<typeof RegisterChoiceScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = { globals: { viewport: { value: "desktop" } } };
export const Celular: Story = { globals: { viewport: { value: "celular" } } };

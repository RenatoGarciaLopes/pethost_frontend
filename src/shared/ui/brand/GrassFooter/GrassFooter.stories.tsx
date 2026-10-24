import { Box, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { GrassFooter } from "./GrassFooter";

const meta = {
  title: "Quintal/Brand/GrassFooter",
  component: GrassFooter,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", design: { board: "Quintal-Casas" }, a11y: { test: "error" } },
  decorators: [
    (Story) => (
      <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Typography sx={{ p: 3, flexGrow: 1 }}>Fim da página: role até o rodapé para a terra escurecer.</Typography>
        {Story()}
      </Box>
    ),
  ],
} satisfies Meta<typeof GrassFooter>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Gramado do hero em cima, três camadas de terra, pedrinhas e raízes. A terra escurece com a rolagem. */
export const Default: Story = {
  name: "REQ-UIC-011 Rodapé de gramado",
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByRole("contentinfo");
    await expect(within(footer).getByRole("navigation", { name: "Navegue" })).toBeVisible();
    await expect(within(footer).getByRole("link", { name: "Como funciona" })).toHaveAttribute(
      "href",
      "/#como-funciona",
    );
  },
};

/** Celular (390 px): mesma cena, mais baixa, cortando as bordas sem distorcer pedrinhas e raízes. */
export const Celular: Story = {
  name: "REQ-UIC-011 Celular (390 px)",
  globals: { viewport: { value: "celular", isRotated: false } },
};

/** A sessão controla os destinos; tutor não recebe convite para entrar ou criar conta. */
export const Tutor: Story = {
  args: { accountRole: "owner" },
  play: async ({ canvasElement }) => {
    const footer = within(within(canvasElement).getByRole("contentinfo"));
    await expect(footer.getByRole("link", { name: "Minhas estadias" })).toHaveAttribute("href", "/owner/bookings");
    await expect(footer.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
  },
};

/** Anfitrião volta ao painel existente. */
export const Anfitriao: Story = { args: { accountRole: "host" } };

/** Reserva para barra fixa da página, sem cobrir os direitos ou os atalhos no fim da rolagem. */
export const CelularComBarraFixa: Story = {
  globals: { viewport: { value: "celular", isRotated: false } },
  args: { mobileBottomSpace: 12 },
};

/** Com `prefers-reduced-motion`, o rodapé não ouve a rolagem: fica o degradê estático (sem `--descida`). */
export const MovimentoReduzido: Story = {
  name: "REQ-UIC-011 Movimento reduzido",
  parameters: { reducedMotion: "reduce" },
  beforeEach: () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList;
    return () => {
      window.matchMedia = original;
    };
  },
  play: async ({ canvasElement }) => {
    const footer = within(canvasElement).getByTestId("grass-footer");
    await expect(footer.style.getPropertyValue("--descida")).toBe("");
  },
};

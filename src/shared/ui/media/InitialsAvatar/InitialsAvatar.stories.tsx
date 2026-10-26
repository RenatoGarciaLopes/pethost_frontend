import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stack, Typography } from "@mui/material";
import { InitialsAvatar } from "./InitialsAvatar";

const meta = {
  title: "Quintal/Media/InitialsAvatar",
  component: InitialsAvatar,
  tags: ["autodocs"],
  args: { name: "Ana Souza (teste)" },
} satisfies Meta<typeof InitialsAvatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SemFoto: Story = {};
export const NomeUnico: Story = { args: { name: "Ângela" } };
export const SemNome: Story = { args: { name: "" } };
export const FotoIndisponivel: Story = { args: { src: "data:image/png;base64,invalid" } };
export const ComFoto: Story = {
  args: {
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%237FC4E0'/%3E%3Ccircle cx='50' cy='50' r='25' fill='%231F1A17'/%3E%3C/svg%3E",
    alt: "Foto sintética de exemplo",
  },
};

/** Duas opções de revisão; a recomendada é usada em todos os consumidores. */
export const Comparacao: Story = {
  render: (args) => (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Typography>Letra branca com contraste AA em todos os tamanhos, sem exceção para texto grande.</Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <InitialsAvatar {...args} tone="coral" size={40} />
        <Typography>Recomendado: coral atenuado #B6533A. Contraste 4,90:1.</Typography>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <InitialsAvatar {...args} tone="earth" size={40} />
        <Typography>Alternativa: café da paleta #5A4E45. Contraste 8,04:1.</Typography>
      </Stack>
      <Stack direction="row" spacing={2}>
        {[32, 40, 48, 96].map((size) => (
          <InitialsAvatar key={size} {...args} size={size} />
        ))}
      </Stack>
      <Typography variant="body2">
        O coral original com branco fica em 3,03:1. A recomendação suaviza a saturação e escurece o tom para manter a
        leitura das iniciais pequenas.
      </Typography>
    </Stack>
  ),
};
export const Celular: Story = { ...Comparacao, globals: { viewport: { value: "celular", isRotated: false } } };

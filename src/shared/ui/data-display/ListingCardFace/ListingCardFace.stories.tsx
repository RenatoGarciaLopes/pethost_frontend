import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box } from "@mui/material";
import { Sticker } from "@/shared/ui/feedback/Sticker";
import { ListingCardFace } from "./ListingCardFace";

const meta = {
  title: "Quintal/DataDisplay/ListingCardFace",
  component: ListingCardFace,
  tags: ["autodocs"],
  parameters: { design: { board: "Quintal-Busca" } },
  decorators: [
    (Story) => (
      <Box sx={{ maxWidth: 320 }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    cover: <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>Cantinho sem foto</Box>,
    host: { name: "Cida Souza" },
    title: "Casa da Cida",
    location: "Zona 7 · 1,4 km de você",
    attributes: [
      { icon: "house", label: "Casa" },
      { icon: "yard", label: "Quintal" },
      { icon: "fast", label: "Responde rápido" },
    ],
    price: (
      <>
        <strong>R$ 60,00</strong>/noite
      </>
    ),
  },
} satisfies Meta<typeof ListingCardFace>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A cara do card como na lista da busca, sem foto. */
export const SemFoto: Story = { name: "REQ-SRCH-007 Sem foto" };

/** Com o selo Vizinho e uma linha extra (no cadastro, quem o cantinho recebe). */
export const ComSelo: Story = {
  name: "REQ-SRCH-021 Com selo e linha extra",
  args: {
    badge: <Sticker label="Vizinho" color="grama" tilt={4} />,
    children: <Box sx={{ fontSize: 13 }}>Recebe cachorro e gato · até 3 pets</Box>,
  },
};

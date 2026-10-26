import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stack, Typography } from "@mui/material";
import { PetAvatar } from "./PetAvatar";

const meta = {
  title: "Quintal/Media/PetAvatar",
  component: PetAvatar,
  tags: ["autodocs"],
  args: { petId: "mel", name: "Mel", species: "cat" },
} satisfies Meta<typeof PetAvatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SemFoto: Story = {};
export const FotoIndisponivel: Story = { args: { src: "data:image/png;base64,invalid" } };
export const Conjunto: Story = {
  render: () => (
    <Stack spacing={2}>
      <Typography variant="h2">A turma do Quintal</Typography>
      {["dog", "cat", "canary", "rabbit", "hamster", "fish", "turtle", "exotic"].map((species) => (
        <Stack key={species} direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          {Array.from({ length: ["dog", "cat"].includes(species) ? 4 : 1 }, (_, id) => (
            <PetAvatar key={id} petId={String(id)} name={`${species} ${id + 1}`} species={species} size={64} />
          ))}
          <Typography>{species}</Typography>
        </Stack>
      ))}
      <Stack direction="row" spacing={1}>
        {[28, 30, 40, 48, 64, 72].map((size) => (
          <PetAvatar key={size} petId="mel" name="Mel" species="cat" size={size} />
        ))}
      </Stack>
    </Stack>
  ),
};

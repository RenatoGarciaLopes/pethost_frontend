import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { PetWelcome } from "./PetWelcome";
function Frame({ role = "owner" }: { role?: PersonalRole }) {
  return (
    <AnnouncerProvider>
      <PetWelcome name="Bóris" role={role} onAnother={fn()} />
    </AnnouncerProvider>
  );
}
const meta = {
  title: "Features/Pets/PetWelcome",
  component: Frame,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet", section: "Prazer" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = {};
export const Anfitriao: Story = { args: { role: "host" } };

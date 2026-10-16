import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { petDto } from "@/test/fixtures/pets";
import type { PetDto } from "../api/contracts";
import { toPet } from "../api/mappers";
import { PetIdCard } from "./PetIdCard";

const meta = {
  title: "Pets/PetIdCard",
  component: PetIdCard,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: { pet: toPet(petDto() as PetDto), now: new Date("2026-10-15T12:00:00Z") },
} satisfies Meta<typeof PetIdCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};

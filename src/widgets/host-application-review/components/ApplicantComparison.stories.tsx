import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { ApplicantComparison } from "./ApplicantComparison";
const meta = {
  title: "Admin/ApplicantComparison",
  component: ApplicantComparison,
  parameters: { design: { board: "Fluxo-Admin" } },
  args: { application: adminApplicationFixture() },
} satisfies Meta<typeof ApplicantComparison>;
export default meta;
export const Padrao: StoryObj<typeof meta> = {};

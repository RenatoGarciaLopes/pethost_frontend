import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { paymentSessionFixture } from "@/test/fixtures/bookingPayment";
import { StripePaymentForm } from "./StripePaymentForm";

/** Story sem credencial: testa configuração ausente. SDK é exercitado com mock nos testes/E2E. */
const meta = {
  title: "Features/Bookings/StripePaymentForm",
  component: StripePaymentForm,
  tags: ["autodocs"],
  args: { session: paymentSessionFixture, returnPath: "/owner/bookings/demo/payment", onSubmitted: async () => {} },
} satisfies Meta<typeof StripePaymentForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ConfiguracaoAusente: Story = {};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };

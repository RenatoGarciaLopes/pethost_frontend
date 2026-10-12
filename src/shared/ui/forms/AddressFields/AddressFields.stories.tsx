import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { AddressFields } from "./AddressFields";

const empty = { zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

/**
 * Formulário e cache próprios por story. O cache do CEP já vem semeado: a story nunca chama o ViaCEP de verdade.
 */
function Frame({ zipCode = "", errors = false }: { zipCode?: string; errors?: boolean }) {
  const [client] = useState(() => {
    const seeded = new QueryClient();
    seeded.setQueryData(["cep", "87020000"], {
      street: "Avenida Brasil",
      neighborhood: "Zona 01",
      city: "Maringá",
      state: "PR",
    });
    seeded.setQueryData(["cep", "99999999"], null);
    return seeded;
  });
  return (
    <QueryClientProvider client={client}>
      <Form zipCode={zipCode} errors={errors} />
    </QueryClientProvider>
  );
}

function Form({ zipCode, errors }: { zipCode: string; errors: boolean }) {
  const form = useForm({
    defaultValues: { address: { ...empty, zipCode } },
    errors: errors
      ? {
          address: {
            zipCode: { type: "manual", message: "O CEP tem 8 números." },
            number: { type: "manual", message: "Falta o número (ou S/N)." },
          },
        }
      : undefined,
  });
  return (
    <Box sx={{ maxWidth: 520 }}>
      <FormProvider {...form}>
        <AddressFields />
      </FormProvider>
    </Box>
  );
}

const meta = {
  title: "Quintal/Forms/AddressFields",
  component: Frame,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta / Criar conta 2/2" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** CEP vazio: o resto fica travado até a busca. */
export const Vazio: Story = { name: "REQ-OREG-005 Vazio" };

/** CEP achado: rua, bairro, cidade e UF preenchidos; número e complemento com a pessoa. */
export const CepAchado: Story = { name: "REQ-OREG-005 CEP achado", args: { zipCode: "87020000" } };

/** CEP não achado: aviso e campos livres. */
export const CepNaoAchado: Story = { name: "REQ-OREG-005 CEP não achado", args: { zipCode: "99999999" } };

/** Mensagens de erro do schema nos campos. */
export const ComErros: Story = { name: "REQ-OREG-003 Com erros", args: { zipCode: "8702", errors: true } };

/** Largura de celular: uma coluna. */
export const Celular: Story = {
  name: "REQ-OREG-005 Celular",
  args: { zipCode: "87020000" },
  globals: { viewport: { value: "celular", isRotated: false } },
};

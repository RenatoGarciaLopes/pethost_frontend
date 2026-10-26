"use client";

import { Stack, Typography } from "@mui/material";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import type { RegistrationVariant } from "../../lib/registrationVariants";

export interface AddressStepProps {
  variant: RegistrationVariant;
}

/** Passo 2, "Onde você mora" (REQ-OREG-002, 005, 006): por que pedimos o endereço (da variante) e os campos com CEP. */
export function AddressStep({ variant }: AddressStepProps) {
  return (
    <Stack spacing={3}>
      <Typography color="text.secondary">{variant.intro.address}</Typography>
      <AddressFields name="address" />
    </Stack>
  );
}

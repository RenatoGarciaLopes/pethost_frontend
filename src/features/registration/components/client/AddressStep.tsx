"use client";

import { Stack, Typography } from "@mui/material";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import { registrationCopy } from "../../lib/registrationCopy";

/** Passo 2, "Onde você mora" (REQ-OREG-002, 005, 006): por que pedimos o endereço e os campos com CEP. */
export function AddressStep() {
  return (
    <Stack spacing={3}>
      <Typography color="text.secondary">{registrationCopy.steps.address.why}</Typography>
      <AddressFields name="address" />
    </Stack>
  );
}

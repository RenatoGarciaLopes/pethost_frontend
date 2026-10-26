"use client";

import { Typography } from "@mui/material";
import { useFormState } from "react-hook-form";

/**
 * Erro da API sem campo na tela (`applyFieldErrors` → `root.server`). Assina só `errors.root`,
 * então não re-renderiza enquanto a pessoa digita.
 */
export function ServerFormError() {
  const { errors } = useFormState({ name: "root" });
  const message = errors.root?.server?.message;
  if (!message) return null;
  return (
    <Typography color="error" role="alert" sx={{ mt: 2 }}>
      {message}
    </Typography>
  );
}

"use client";
import { useId } from "react";
import { Box, Button, Typography } from "@mui/material";

/** Form navigation labels and callbacks; no routing or persistence inside the primitive. */
export interface FormActionsProps {
  /** Visible back action label. */ backLabel: string;
  /** Visible next action label (should name the destination). */ nextLabel: string;
  /** Back callback; form owns draft preservation. */ onBack: () => void;
  /** Continue callback; optional when `nextType="submit"` (the form handles it). */ onNext?: () => void;
  /** Explanation disabling continue, displayed and associated with the button. */ disabledReason?: string;
  /** Continue button type, default button; submit belongs to the owning form. */ nextType?: "button" | "submit";
  /** Request in flight: continue is disabled and marked `aria-busy` (prevents double submit). */ busy?: boolean;
}
/**
 * Responsive back/continue bar with mobile safe-area padding and content spacer.
 * Use for multi-step forms, not global site navigation.
 * @example <FormActions backLabel="Voltar" nextLabel="Continuar: saúde" onBack={back} onNext={next} />
 */
export function FormActions({
  backLabel,
  nextLabel,
  onBack,
  onNext,
  disabledReason,
  nextType = "button",
  busy = false,
}: FormActionsProps) {
  const id = useId();
  return (
    <Box
      sx={{
        paddingBottom: {
          xs: disabledReason
            ? "calc(176px + env(safe-area-inset-bottom))"
            : "calc(112px + env(safe-area-inset-bottom))",
          sm: 0,
        },
      }}
    >
      <Box
        sx={{
          position: { xs: "fixed", sm: "static" },
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          // Fixa no celular com o fundo da página; no computador some no cartão de quem usa.
          bgcolor: { xs: "background.default", sm: "transparent" },
          p: { xs: 2, sm: 0 },
          pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 0 },
          borderTop: { xs: "2px solid", sm: "none" },
          borderColor: "text.primary",
        }}
      >
        {disabledReason && (
          <Typography id={id} sx={{ mb: 1 }}>
            {disabledReason}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Button variant="quiet" type="button" onClick={onBack}>
            {backLabel}
          </Button>
          <Button
            variant="contained"
            type={nextType}
            onClick={onNext}
            disabled={busy || Boolean(disabledReason)}
            aria-busy={busy || undefined}
            aria-describedby={disabledReason ? id : undefined}
          >
            {nextLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

"use client";
import { useId } from "react";
import { Box, Button, Typography } from "@mui/material";

/** Form navigation labels and callbacks; no routing or persistence inside the primitive. */
export interface FormActionsProps {
  /** Visible back action label. */ backLabel: string;
  /** Visible next action label (should name the destination). */ nextLabel: string;
  /** Back callback; form owns draft preservation. */ onBack: () => void;
  /** Continue callback. */ onNext: () => void;
  /** Explanation disabling continue, displayed and associated with the button. */ disabledReason?: string;
  /** Continue button type, default button; submit belongs to the owning form. */ nextType?: "button" | "submit";
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
          bgcolor: "background.default",
          p: 2,
          pb: "max(16px, env(safe-area-inset-bottom))",
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
            disabled={Boolean(disabledReason)}
            aria-describedby={disabledReason ? id : undefined}
          >
            {nextLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

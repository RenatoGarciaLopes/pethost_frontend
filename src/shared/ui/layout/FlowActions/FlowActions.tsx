import { Box, Button } from "@mui/material";

export interface FlowActionsProps {
  /** Moves to the previous step; omit on the first step. */
  onBack?: () => void;
  /** Moves to the next step or submits the flow. */
  onContinue: () => void;
  /** Visible back button text. */
  backLabel?: string;
  /** Visible primary action text. */
  continueLabel?: string;
  /** Disables the back action while the flow is saving. */
  backDisabled?: boolean;
  /** Disables the primary action while the flow is saving or invalid. */
  continueDisabled?: boolean;
}

/**
 * Flow navigation actions; the mobile action bar stays above the device safe area.
 * @example <FlowActions onBack={goBack} onContinue={goNext} />
 */
export function FlowActions({
  onBack,
  onContinue,
  backLabel = "Voltar",
  continueLabel = "Continuar",
  backDisabled = false,
  continueDisabled = false,
}: FlowActionsProps) {
  return (
    <Box
      component="nav"
      aria-label="Ações do cadastro"
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 2,
        position: { xs: "fixed", md: "static" },
        zIndex: { xs: "appBar", md: "auto" },
        insetInline: { xs: 0, md: "auto" },
        bottom: { xs: 0, md: "auto" },
        width: { xs: "100%", md: "auto" },
        boxSizing: "border-box",
        px: { xs: 2, md: 0 },
        pt: { xs: 1, md: 0 },
        pb: { xs: "calc(8px + env(safe-area-inset-bottom))", md: 0 },
        bgcolor: { xs: "background.paper", md: "transparent" },
        borderTop: { xs: "2px solid", md: 0 },
        borderColor: "divider",
      }}
    >
      {onBack ? (
        <Button variant="text" disabled={backDisabled} onClick={onBack}>
          {backLabel}
        </Button>
      ) : null}
      <Button
        variant="contained"
        onClick={onContinue}
        disabled={continueDisabled}
        sx={{ minWidth: 160, minHeight: 56 }}
      >
        {continueLabel}
      </Button>
    </Box>
  );
}

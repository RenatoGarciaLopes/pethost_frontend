import { Box } from "@mui/material";
import { appShellCopy } from "@/shared/config/appShellCopy";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
/** Carregamento de rota (REQ-SHELL-012), com anúncio único e movimento reduzido herdado do Quintal.
 * @example <Loading /> // usado automaticamente pelo App Router
 */
export default function Loading() {
  return (
    <Box sx={{ minHeight: "60dvh", display: "grid", placeItems: "center" }}>
      <SniffLoader label={appShellCopy.loading} />
    </Box>
  );
}

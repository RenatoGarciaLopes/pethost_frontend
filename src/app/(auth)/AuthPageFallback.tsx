import { Box } from "@mui/material";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

/**
 * Enquanto a página de conta confere a sessão: o loader da marca, nunca o formulário
 * (quem já está logado é redirecionado sem ver o formulário piscar, REQ-AUTH-014).
 */
export function AuthPageFallback() {
  return (
    <Box component="main" id="conteudo" sx={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <SniffLoader />
    </Box>
  );
}

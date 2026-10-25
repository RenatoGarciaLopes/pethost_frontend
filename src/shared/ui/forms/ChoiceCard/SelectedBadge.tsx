import { Box } from "@mui/material";

/**
 * Selo de cartão escolhido: círculo preto com ✓ no canto de cima à direita (o do cadastro, 074). Decorativo; o
 * estado vem do `aria-pressed` ou do radio do cartão. Precisa de um pai `position: relative`.
 * @example <ButtonBase sx={{ position: "relative" }}>…{selected && <SelectedBadge />}</ButtonBase>
 */
export function SelectedBadge() {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 22,
        height: 22,
        borderRadius: "50%",
        bgcolor: "text.primary",
        color: "success.main",
        fontWeight: 800,
      }}
    >
      ✓
    </Box>
  );
}

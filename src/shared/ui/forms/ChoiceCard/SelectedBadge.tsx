import { Box } from "@mui/material";

/**
 * Selo de cartão escolhido: círculo preto com ✓ no canto de cima à direita (o do cadastro, 074). Decorativo; o
 * estado vem do `aria-pressed` ou do radio do cartão. Precisa de um pai `position: relative`. `corner` o pendura
 * sobre a quina, como adesivo, e deixa a largura toda para o texto (cartões compactos, 104).
 * @example <ButtonBase sx={{ position: "relative" }}>…{selected && <SelectedBadge />}</ButtonBase>
 */
export function SelectedBadge({ placement = "inside" }: { placement?: "inside" | "corner" }) {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        position: "absolute",
        top: placement === "corner" ? -9 : 10,
        right: placement === "corner" ? -9 : 10,
        zIndex: 1,
        width: 22,
        height: 22,
        borderRadius: "50%",
        bgcolor: "text.primary",
        color: "success.main",
        fontWeight: 800,
        // Na quina, um aro de papel separa o selo da borda do cartão, como adesivo.
        ...(placement === "corner" && {
          display: "grid",
          placeItems: "center",
          lineHeight: 1,
          fontSize: 14,
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.default}`,
        }),
      }}
    >
      ✓
    </Box>
  );
}

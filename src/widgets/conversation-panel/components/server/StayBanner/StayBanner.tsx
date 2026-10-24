import { Box, Typography } from "@mui/material";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";

export interface StayBannerProps {
  /** Nome do status da reserva, igual ao das telas de estadia ("Acontecendo"). */
  status: string;
  /** A frase da estadia ("20 a 25 de dez. · Pipoca está na casa de Dona Cida"). */
  text: string;
}

/**
 * A faixa céu logo abaixo do cabeçalho da conversa (spec 055, REQ-CHAT-011): o selo do status e a frase da estadia,
 * com o tracejado embaixo separando das mensagens. Lembra quem lê de que estadia se está falando.
 *
 * Use só enquanto há estadia acontecendo entre os dois lados. Não use como aviso de erro ou bloqueio (para isso, `Notice`).
 *
 * @example <StayBanner status="Acontecendo" text="20 a 25 de dez. · Pipoca está na casa de Dona Cida" />
 */
export function StayBanner({ status, text }: StayBannerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.5,
        px: { xs: 1.5, md: 2.5 },
        py: 1.25,
        bgcolor: "scene.skyTop",
        borderBottom: "2px dashed",
        borderColor: "quintal.linha",
      }}
    >
      <StatusPill tone="info" size="sm" label={status} />
      <Typography variant="body2">{text}</Typography>
    </Box>
  );
}

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box } from "@mui/material";
import { DoorMark } from "@/shared/ui/brand/DoorMark";

export interface StayPhotoFrameProps {
  /** `card` na lista; `header` maior, no topo do detalhe. */
  size?: "card" | "header";
}

/**
 * Moldura da foto do cantinho nas estadias do tutor (specs 094 e 097): a API ainda não manda foto na reserva, então a
 * porta da casa ocupa o lugar. Decorativa (`aria-hidden`).
 *
 * @example <StayPhotoFrame size="header" />
 */
export function StayPhotoFrame({ size = "card" }: StayPhotoFrameProps) {
  const big = size === "header";
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        width: big ? { xs: 96, md: 144 } : { xs: 88, md: 120 },
        height: big ? { xs: 80, md: 112 } : { xs: 72, md: 96 },
        bgcolor: theme.palette.quintal.luz,
        border: "2px solid",
        borderColor: "text.primary",
        borderRadius: `${quintalRadii.card}px`,
      })}
    >
      <DoorMark width={big ? 44 : 36} interactive={false} />
    </Box>
  );
}

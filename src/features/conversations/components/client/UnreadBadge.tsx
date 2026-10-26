"use client";

import { Box } from "@mui/material";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { conversationsCopy } from "../../lib/conversationsCopy";

/** O contador de não lidas: número no círculo coral, frase completa para o leitor de tela.
 * @example <UnreadBadge count={2} />
 */
export function UnreadBadge({ count }: { count: number }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-grid",
        placeItems: "center",
        minWidth: 24,
        height: 24,
        px: 0.5,
        borderRadius: `${quintalRadii.pill}px`,
        border: "2px solid",
        borderColor: "text.primary",
        bgcolor: "primary.main",
        fontSize: "0.8rem",
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      <span aria-hidden>{count}</span>
      <Box component="span" sx={visuallyHidden}>
        {conversationsCopy.unread(count)}
      </Box>
    </Box>
  );
}

import { Box, Typography } from "@mui/material";
import { formatBRL } from "@/shared/lib/money";
import { listingPageCopy as copy } from "../lib/listingPageCopy";

/**
 * Diária da lateral: valor em destaque na fonte display e "por pet, por noite" ao lado, como na prancha.
 * @example <NightlyPrice nightlyRate={60} />
 */
export function NightlyPrice({ nightlyRate }: { nightlyRate: number }) {
  return (
    <Typography>
      <Box component="strong" sx={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.6rem" }}>
        {formatBRL(nightlyRate)}
      </Box>{" "}
      <Box component="span" sx={{ color: "text.secondary", fontSize: "0.95rem" }}>
        {copy.price}
      </Box>
    </Typography>
  );
}

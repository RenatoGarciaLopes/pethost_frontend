import { Box } from "@mui/material";
import type { ReactNode } from "react";

/**
 * Grade de carteirinhas como lista (`ul`): 3 colunas no computador, 1 no celular (spec 020).
 * @example <PetGrid><li><PetIdCard … /></li></PetGrid>
 */
export function PetGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
      }}
    >
      {children}
    </Box>
  );
}

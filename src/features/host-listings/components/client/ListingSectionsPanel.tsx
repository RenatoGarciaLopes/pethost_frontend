import { Box, Link, Typography } from "@mui/material";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { LISTING_SECTIONS } from "../../lib/listingSections";
import { listingCopy as copy } from "../../lib/listingCopy";
import type { ListingSectionId } from "../../schemas/listingSchema";
import { sectionAnchor } from "./sections/ListingSectionHost";

export interface ListingSectionsPanelProps {
  /** Seções prontas (salvas e válidas). */
  ready: ReadonlySet<ListingSectionId>;
}

/**
 * O painel de seções do cantinho (REQ-LIST-003): "Faltam N coisas pro seu cantinho abrir" (ou "Tudo pronto!") e o
 * atalho para cada seção com o check de pronta, em texto e marca. As seções podem ser feitas em qualquer ordem.
 *
 * @example <ListingSectionsPanel ready={ready} />
 */
export function ListingSectionsPanel({ ready }: ListingSectionsPanelProps) {
  const missing = LISTING_SECTIONS.length - ready.size;
  return (
    <Box component="nav" aria-label={copy.draft.panelLabel}>
      <Typography role="status" sx={{ fontWeight: 800, fontSize: "1.15rem", mb: 1.5 }}>
        {missing === 0 ? copy.draft.allReady : copy.draft.missing(missing)}
      </Typography>
      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1 }}>
        {LISTING_SECTIONS.map((section) => {
          const done = ready.has(section);
          return (
            <Box component="li" key={section} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px solid",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                  bgcolor: done ? "success.main" : "transparent",
                }}
              >
                {done ? "✓" : ""}
              </Box>
              <Link href={`#${sectionAnchor(section)}`}>{copy.sections[section]}</Link>
              <Box component="span" sx={visuallyHidden}>
                {`, ${done ? copy.ready : copy.pending}`}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

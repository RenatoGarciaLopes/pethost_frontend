import { Box, type BoxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface FlowLayoutProps extends Omit<BoxProps, "children"> {
  /** Progress navigator shown in the left desktop rail and above the step on mobile. */
  progress: ReactNode;
  /** Current flow step. */
  step: ReactNode;
  /** Optional live preview shown in the right desktop rail. */
  preview?: ReactNode;
  /** Flow actions; mobile implementations can stay fixed to the viewport bottom. */
  actions?: ReactNode;
}

/**
 * Three-rail desktop flow layout with a single-column mobile arrangement.
 * @example <FlowLayout progress={<FlowProgress {...props} />} step={<PetStep />} />
 */
export function FlowLayout({ progress, step, preview, actions, sx, ...props }: FlowLayoutProps) {
  return (
    <Box
      {...props}
      sx={[{ pb: { xs: "calc(96px + env(safe-area-inset-bottom))", md: 0 } }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1440,
          mx: "auto",
          px: { xs: 2, md: 4 },
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: preview ? "240px minmax(0, 1fr) 360px" : "240px minmax(0, 1fr)",
          },
          gridTemplateAreas: {
            xs: preview ? '"progress" "step" "preview"' : '"progress" "step"',
            md: preview ? '"progress step preview"' : '"progress step"',
          },
          gap: { xs: 2, md: 4 },
          alignItems: "start",
        }}
      >
        <Box component="aside" aria-label="Etapas do cadastro" sx={{ gridArea: "progress" }}>
          {progress}
        </Box>
        <Box component="section" aria-label="Etapa atual" sx={{ gridArea: "step", minWidth: 0 }}>
          {step}
        </Box>
        {preview ? (
          <Box component="aside" aria-label="Prévia do cadastro" sx={{ gridArea: "preview", minWidth: 0 }}>
            {preview}
          </Box>
        ) : null}
      </Box>
      {actions ? <Box sx={{ mt: { xs: 0, md: 3 } }}>{actions}</Box> : null}
    </Box>
  );
}

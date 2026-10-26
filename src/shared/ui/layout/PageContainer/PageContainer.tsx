import { Box, type BoxProps } from "@mui/material";
import type { ElementType } from "react";

export type PageContainerWidth = "page" | "reading";

export interface PageContainerProps extends BoxProps {
  /** `page` is for dashboards and lists; `reading` is for focused text. */
  width?: PageContainerWidth;
  /** Root element for semantic composition. */
  component?: ElementType;
}

/**
 * Standard page width and responsive gutters for Quintal screens.
 * @example <PageContainer width="page">{children}</PageContainer>
 */
export function PageContainer({ width = "page", component = "div", sx, ...props }: PageContainerProps) {
  return (
    <Box
      {...props}
      component={component}
      sx={[
        {
          width: "100%",
          maxWidth: width === "page" ? 1200 : 720,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 6 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}

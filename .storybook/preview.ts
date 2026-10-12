import type { Preview } from "@storybook/nextjs-vite";
import { createElement, Fragment } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { quintalTheme } from "../src/shared/theme/createQuintalTheme";
import "./fonts.css";

/** Isolated stories use the same Quintal theme as the app, without Next SSR cache. */
const preview: Preview = {
  decorators: [
    (Story) =>
      createElement(
        ThemeProvider,
        { theme: quintalTheme },
        createElement(Fragment, null, createElement(CssBaseline), createElement(Story)),
      ),
  ],
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    viewport: {
      options: {
        desktop: { name: "Desktop", styles: { width: "1440px", height: "960px" }, type: "desktop" },
        celular: { name: "Celular", styles: { width: "390px", height: "844px" }, type: "mobile" },
      },
    },
  },
};
export default preview;

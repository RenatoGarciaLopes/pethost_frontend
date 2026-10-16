import { createTheme } from "@mui/material/styles";
import { expect, it } from "vitest";
import { toStripeAppearance } from "./toStripeAppearance";
it("REQ-PAYOUT-005 cores, borda, raio e fonte vêm do tema, sem variáveis CSS da página no iframe", () => {
  const theme = createTheme({
    palette: {
      primary: { main: "#123456" },
      background: { paper: "#eeeeee" },
      text: { primary: "#222222" },
      divider: "#abcdef",
    },
    shape: { borderRadius: 13 },
    typography: { fontFamily: "var(--font-body, 'Fonte do tema'), sans-serif" },
  });
  expect(toStripeAppearance(theme).variables).toMatchObject({
    colorPrimary: "#123456",
    colorBackground: "#eeeeee",
    colorText: "#222222",
    colorBorder: "#abcdef",
    borderRadius: "13px",
    fontFamily: "'Fonte do tema', sans-serif",
  });
});

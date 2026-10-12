import { quintalCssBaseline } from "./overrides/CssBaseline";
import { quintalButtonBase } from "./overrides/ButtonBase";
import { quintalButton } from "./overrides/Button";
import { quintalPaper } from "./overrides/Paper";
import { quintalCard } from "./overrides/Card";
import { quintalChip } from "./overrides/Chip";
import { quintalTextField } from "./overrides/TextField";
import { quintalOutlinedInput } from "./overrides/OutlinedInput";
import { quintalSwitch } from "./overrides/Switch";
import { quintalToggleButton } from "./overrides/ToggleButton";
import { quintalTooltip } from "./overrides/Tooltip";
import { quintalLink } from "./overrides/Link";
import { createTheme, type Shadows } from "@mui/material/styles";
import { quintalColors as c } from "./tokens/colors";
import { accountTones, feedbackColors, sceneColors, surfaceColors } from "./tokens/semantic";
import { quintalTypography } from "./tokens/typography";
import { hardShadow } from "./tokens/shadows";

/**
 * Tema Quintal do MUI (claro, com variáveis CSS). Mapeamento da paleta conforme o vault
 * `design/09-componentes-mui.md`: primary coral, secondary e info céu, success grama,
 * warning gema, papel na página e branco no `paper`. Cores por conta em `palette.account`
 * e peças de marca em `palette.scene`.
 * @example <ThemeProvider theme={quintalTheme}><CssBaseline /></ThemeProvider>
 */
export const quintalTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    quintal: c,
    primary: { main: c.coral, contrastText: c.tinta },
    secondary: { main: c.ceu, contrastText: c.tinta },
    grama: { main: c.grama, contrastText: c.tinta },
    gema: { main: c.gema, contrastText: c.tinta },
    ceu: { main: c.ceu, contrastText: c.tinta },
    success: { main: feedbackColors.success, contrastText: c.tinta },
    info: { main: feedbackColors.info, contrastText: c.tinta },
    warning: { main: feedbackColors.warning, contrastText: c.tinta },
    error: { main: feedbackColors.error, contrastText: "#FFFFFF" },
    account: accountTones,
    scene: sceneColors,
    text: { primary: c.tinta, secondary: c.texto2 },
    background: { default: surfaceColors.page, paper: surfaceColors.paper },
    divider: c.linha,
  },
  typography: quintalTypography,
  shape: { borderRadius: 18 },
  shadows: [
    "none",
    ...Array.from({ length: 24 }, (_, index) => hardShadow(index < 8 ? 3 : index < 16 ? 5 : 8)),
  ] as Shadows,
  components: {
    MuiCssBaseline: quintalCssBaseline,
    MuiButtonBase: quintalButtonBase,
    MuiButton: quintalButton,
    MuiPaper: quintalPaper,
    MuiCard: quintalCard,
    MuiChip: quintalChip,
    MuiTextField: quintalTextField,
    MuiOutlinedInput: quintalOutlinedInput,
    MuiSwitch: quintalSwitch,
    MuiToggleButton: quintalToggleButton,
    MuiTooltip: quintalTooltip,
    MuiLink: quintalLink,
  },
});

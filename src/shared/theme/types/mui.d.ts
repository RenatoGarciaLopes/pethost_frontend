import type { quintalColors } from "../tokens/colors";
import type { accountTones, sceneColors } from "../tokens/semantic";
import type { PaletteColor, SimplePaletteColorOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    quintal: typeof quintalColors;
    grama: PaletteColor;
    gema: PaletteColor;
    ceu: PaletteColor;
    /** Tom do cabeçalho por conta (spec 004, REQ-SHELL-001). */
    account: typeof accountTones;
    /** Cores das peças de marca (porta, céu, chão). */
    scene: typeof sceneColors;
  }
  interface PaletteOptions {
    quintal?: typeof quintalColors;
    grama?: SimplePaletteColorOptions;
    gema?: SimplePaletteColorOptions;
    ceu?: SimplePaletteColorOptions;
    account?: typeof accountTones;
    scene?: typeof sceneColors;
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    quiet: true;
  }
}
declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    sticker: true;
    ok: true;
    attention: true;
  }
}
declare module "@mui/material/Paper" {
  interface PaperPropsVariantOverrides {
    panel: true;
  }
}

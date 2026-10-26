import type { quintalColors } from "../tokens/colors";
import type { accountTones, avatarTones, sceneColors } from "../tokens/semantic";
import type { PaletteColor, SimplePaletteColorOptions } from "@mui/material/styles";
import type { quintalRadii } from "../tokens/radii";

declare module "@mui/material/styles" {
  interface Palette {
    quintal: typeof quintalColors;
    grama: PaletteColor;
    gema: PaletteColor;
    ceu: PaletteColor;
    /** Tom do cabeçalho por conta (spec 004, REQ-SHELL-001). */
    account: typeof accountTones;
    /** Cores AA das iniciais humanas (076). */
    avatar: typeof avatarTones;
    /** Cores das peças de marca (porta, céu, chão). */
    scene: typeof sceneColors;
  }
  interface Theme {
    quintal: { radius: typeof quintalRadii };
  }
  interface ThemeOptions {
    quintal?: { radius?: typeof quintalRadii };
  }
  interface PaletteOptions {
    quintal?: typeof quintalColors;
    grama?: SimplePaletteColorOptions;
    gema?: SimplePaletteColorOptions;
    ceu?: SimplePaletteColorOptions;
    account?: typeof accountTones;
    avatar?: typeof avatarTones;
    scene?: typeof sceneColors;
  }
}
declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    ok: true;
  }
}
declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    quiet: true;
    ok: true;
  }
}

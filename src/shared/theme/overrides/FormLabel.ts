import type { Components, Theme } from "@mui/material/styles";
import { quintalColors as c } from "../tokens/colors";

/**
 * Rótulos de campo (vale para o `InputLabel` do `TextField` e o `FormLabel` de grupos):
 * - sempre em tinta, inclusive com foco (coral sobre branco fica perto de 3:1, abaixo do AA);
 * - erro na cor de erro (contraste AA conferido em `contrast.test.ts`);
 * - sem asterisco: obrigatório é o normal e o opcional vem escrito no rótulo
 *   (`design/17-cadastros-e-formularios.md`, regra 6). O campo continua com `aria-required`.
 */
export const quintalFormLabel: Components<Theme>["MuiFormLabel"] = {
  styleOverrides: {
    root: {
      color: c.tinta,
      "&.Mui-focused": { color: c.tinta },
      "&.Mui-error": { color: c.erro },
    },
    asterisk: { display: "none" },
  },
};

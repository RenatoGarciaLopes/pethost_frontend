/**
 * `sx` que esconde da tela e mantém para o leitor de tela (texto de apoio, regiões vivas). Medidas em px:
 * no `sx` do MUI, `1` sozinho significa 100%.
 * @example <Box component="span" sx={visuallyHidden}>Menu da conta de Camila</Box>
 */
export const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

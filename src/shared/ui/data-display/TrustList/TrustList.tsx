import { Box, Stack, Typography } from "@mui/material";

export interface TrustListProps {
  /** Garantias curtas, na ordem em que aparecem (ex.: "Foto todo dia"). */
  items: readonly string[];
  /** Rótulo acessível da lista. */
  label?: string;
}

/**
 * Lista de garantias da PetHost com selo desenhado (grama com traço tinta).
 * Usada ao lado de formulários (entrar, criar conta) e na home; o texto vem de quem usa.
 * O selo é decorativo (`aria-hidden`); o significado está no texto.
 *
 * @example <TrustList items={["Conversa antes de fechar", "Foto todo dia"]} />
 */
export function TrustList({ items, label = "Garantias da PetHost" }: TrustListProps) {
  return (
    <Stack component="ul" aria-label={label} spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
      {items.map((item) => (
        <Stack component="li" key={item} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Box
            component="svg"
            viewBox="0 0 28 28"
            aria-hidden
            sx={{ width: 28, height: 28, flexShrink: 0, color: "text.primary" }}
          >
            <circle
              cx="14"
              cy="14"
              r="12"
              fill="var(--mui-palette-success-main)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M8.5 14.5l3.6 3.4 7.4-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Box>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {item}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

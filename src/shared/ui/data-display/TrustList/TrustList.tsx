import { Box, Stack, Typography } from "@mui/material";
import { Surface } from "@/shared/ui/layout/Surface";

interface TrustCardItem {
  title: string;
  description: string;
  icon: "chat" | "camera" | "lock";
}

export type TrustListProps = {
  label?: string;
} & ({ items: readonly string[]; variant?: "list" } | { items: readonly TrustCardItem[]; variant: "cards" });

/**
 * Lista de garantias da PetHost com selo desenhado (grama com traço tinta).
 * Usada ao lado de formulários (entrar, criar conta) e na home; o texto vem de quem usa.
 * O selo é decorativo (`aria-hidden`); o significado está no texto.
 *
 * @example <TrustList items={["Conversa antes de fechar", "Foto todo dia"]} />
 */
export function TrustList(props: TrustListProps) {
  const { label = "Garantias da PetHost" } = props;
  if (props.variant === "cards")
    return (
      <Box
        component="ul"
        aria-label={label}
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2,
        }}
      >
        {props.items.map((item) => (
          <Surface
            component="li"
            key={item.title}
            sx={{
              bgcolor: "background.default",
              boxShadow: "none",
              minHeight: 104,
              p: { xs: 2, md: 2.5 },
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <TrustIcon kind={item.icon} />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="h2"
                sx={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.2, mb: 0.5 }}
              >
                {item.title}
              </Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>{item.description}</Typography>
            </Box>
          </Surface>
        ))}
      </Box>
    );
  return (
    <Stack component="ul" aria-label={label} spacing={1.5} sx={{ listStyle: "none", p: 0, m: 0 }}>
      {props.items.map((item) => (
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

/** Ícones da prancha: desenhos locais decorativos, o texto ao lado comunica a garantia. */
function TrustIcon({ kind }: { kind: TrustCardItem["icon"] }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      sx={(theme) => ({
        width: 42,
        height: 42,
        flexShrink: 0,
        stroke: theme.palette.quintal.tinta,
        strokeWidth: 2.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
        "--grass": theme.palette.quintal.grama,
        "--yellow": theme.palette.quintal.gema,
        "--sky": theme.palette.quintal.ceu,
      })}
    >
      {kind === "chat" ? (
        <>
          <path d="M20 20h20q4 0 4 4v12q0 4-4 4h-2v7l-9-7H20q-4 0-4-4V24q0-4 4-4Z" fill="white" />
          <path d="M7 7h24q4 0 4 4v14q0 4-4 4H17L7 37v-8H6q-4 0-4-4V12q0-5 5-5Z" fill="var(--grass)" />
          <path d="M11 18h1m6 0h1m6 0h1" strokeWidth="4" />
        </>
      ) : kind === "camera" ? (
        <>
          <path d="M7 13h9l3-5h11l3 5h7q4 0 4 4v23H4V17q0-4 3-4Z" fill="var(--yellow)" />
          <circle cx="24" cy="26" r="10" fill="white" />
          <circle cx="24" cy="26" r="5" />
          <path d="M22 24h.1m5 0h.1m-5 5q3 3 5 0" strokeWidth="2" />
        </>
      ) : (
        <>
          <path d="M12 23v-9a12 12 0 0 1 24 0v9" />
          <rect x="7" y="21" width="34" height="24" rx="5" fill="var(--sky)" />
          <circle cx="24" cy="30" r="2.5" fill="currentColor" />
          <path d="M24 32v6" />
        </>
      )}
    </Box>
  );
}

import { Box, Stack, Typography } from "@mui/material";
import type { ElementType, ReactNode } from "react";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { InitialsAvatar } from "@/shared/ui/media/InitialsAvatar";
import { AttributeIcon, type AttributeIconName } from "./AttributeIcon";

/** Um atributo da linha de ícones ("Casa", "Quintal", "Responde rápido"). */
export interface ListingCardAttribute {
  icon: AttributeIconName;
  label: string;
}

export interface ListingCardFaceProps {
  /** O que vai dentro da moldura 4:3: a foto de capa ou o aviso de sem foto. */
  cover: ReactNode;
  /** Selo no canto de cima da foto (o Vizinho). */
  badge?: ReactNode;
  /** Quem recebe: o chip com avatar e nome sobre a foto. */
  host: { name: string; avatarUrl?: string | null };
  title: ReactNode;
  /** Elemento do título (padrão `h2`, como na lista da busca). */
  titleComponent?: ElementType;
  /** Ao lado do título (a nota). */
  titleAside?: ReactNode;
  /** Bairro e distância ou cidade. */
  location: ReactNode;
  attributes?: readonly ListingCardAttribute[];
  /** Linhas extras entre os atributos e o preço (compatibilidade do pet, quem o cantinho recebe). */
  children?: ReactNode;
  price: ReactNode;
}

/**
 * A cara do card do cantinho (prancha da busca): a foto é a moldura (contorno de tinta, sombra dura 4 px, 4:3) com o
 * selo e o chip do anfitrião; o texto fica fora, embaixo (título, lugar, atributos, preço). Só apresentação, sem
 * link nem dados: a busca a põe dentro do link do resultado (`ListingCard`) e o cadastro do cantinho a monta ao vivo
 * (104). Herda a cor do texto de quem a contém.
 *
 * @example <ListingCardFace cover={<img alt="" src={url} />} host={{ name: "Cida" }} title="Casa da Cida" location="Zona 7 · Maringá" price="R$ 60,00/noite" />
 */
export function ListingCardFace({
  cover,
  badge,
  host,
  title,
  titleComponent = "h2",
  titleAside,
  location,
  attributes = [],
  children,
  price,
}: ListingCardFaceProps) {
  return (
    <>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          border: "2px solid",
          borderColor: "text.primary",
          borderRadius: `${quintalRadii.card}px`,
          boxShadow: "4px 4px 0 currentColor",
          aspectRatio: "4 / 3",
          bgcolor: "action.hover",
        }}
      >
        {cover}
        {badge && <Box sx={{ position: "absolute", top: 12, right: 12 }}>{badge}</Box>}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            left: 12,
            bottom: 12,
            maxWidth: "calc(100% - 24px)",
            alignItems: "center",
            bgcolor: "background.default",
            border: "2px solid",
            borderColor: "text.primary",
            borderRadius: `${quintalRadii.pill}px`,
            pl: 0.5,
            pr: 1.5,
            py: 0.5,
          }}
        >
          <InitialsAvatar
            name={host.name}
            src={host.avatarUrl}
            size={28}
            sx={{ fontWeight: 800, fontSize: 11, border: "2px solid", borderColor: "text.primary" }}
          />
          <Typography component="span" noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
            {host.name}
          </Typography>
        </Stack>
      </Box>
      <Stack spacing={0.75} sx={{ pt: 1.5, px: 0.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography
            component={titleComponent}
            sx={{ fontFamily: "var(--font-display)", fontSize: 20, lineHeight: 1.2, m: 0 }}
          >
            {title}
          </Typography>
          {titleAside}
        </Stack>
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{location}</Typography>
        {attributes.length > 0 && (
          <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", columnGap: 2, rowGap: 0.5 }}>
            {attributes.map(({ icon, label }) => (
              <Stack key={label} direction="row" spacing={0.75} sx={{ alignItems: "center", fontSize: 13 }}>
                <AttributeIcon name={icon} />
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {label}
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
        {children}
        <Typography sx={{ fontSize: 14 }}>{price}</Typography>
      </Stack>
    </>
  );
}

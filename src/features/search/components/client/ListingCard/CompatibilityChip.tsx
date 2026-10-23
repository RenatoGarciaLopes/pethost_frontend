"use client";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { searchQueries } from "../../../api/queries";
import { compatibilityLabel } from "../../../lib/compatibilityLabel";
import type { CompatibilityPet } from "../../../types";

/** Quem confere e o que confere. @example { accountId, listingId, pet, stay: { checkIn, checkOut } } */
export interface CompatibilityChipProps {
  accountId: string;
  listingId: string;
  pet: CompatibilityPet;
  stay: { checkIn?: string; checkOut?: string };
}

/**
 * Chip "✓ Combina com a Pipoca" (verde) ou "! Tem gato em casa" (tracejado), vindo de
 * `GET /listings/{id}/compatibility`. Só avisa; enquanto carrega ou se falhar, não mostra nada (não inventa).
 * @example <CompatibilityChip accountId="owner-1" listingId={listing.id} pet={pet} stay={{}} />
 */
export function CompatibilityChip({ accountId, listingId, pet, stay }: CompatibilityChipProps) {
  const { data } = useQuery(searchQueries.compatibility(accountId, listingId, pet.id, stay));
  if (!data) return null;
  const { tone, text } = compatibilityLabel(data);
  const match = tone === "match";
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-block",
        fontSize: 13,
        fontWeight: 700,
        lineHeight: "20px",
        px: 1.25,
        py: "1px",
        color: "text.primary",
        borderRadius: `${quintalRadii.pill}px`,
        border: `2px ${match ? "solid" : "dashed"} ${theme.palette.quintal.tinta}`,
        bgcolor: match ? "grama.main" : "transparent",
      })}
    >
      {match ? "✓ " : "! "}
      {text}
    </Box>
  );
}

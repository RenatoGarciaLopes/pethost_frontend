"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useId } from "react";
import { useWatch } from "react-hook-form";
import { ListingCardFace, type ListingCardAttribute } from "@/shared/ui/data-display/ListingCardFace";
import { listingCopy } from "../../lib/listingCopy";
import { acceptedSpeciesText, capacityText, rateTexts } from "../../lib/listingSummary";
import type { ListingFormValues } from "../../schemas/listingSchema";
import { HomeIllustration } from "./fields/HomeIllustration";

const copy = listingCopy.preview;
const muted = { color: "text.secondary" } as const;

/**
 * O card do cantinho se montando ao vivo (104), com a mesma cara do card da busca (`ListingCardFace`): título, bairro
 * e cidade (nunca o endereço exato), casa e quintal, quem recebe e a diária. O que ainda não foi respondido aparece
 * apagado, com o lugar marcado. Lê o formulário do assistente (precisa de `FormProvider`).
 *
 * @example <ListingPreview firstName="Cida" />
 */
export function ListingPreview({ firstName }: { firstName: string }) {
  const id = useId();
  const values = useWatch() as ListingFormValues;
  const { homeType, hasYard, title, address, acceptedSpecies, capacity, nightlyRate } = values;
  const attributes: ListingCardAttribute[] = [
    ...(homeType ? [{ icon: homeType, label: listingCopy.homeTypes[homeType] }] : []),
    ...(hasYard ? [{ icon: "yard" as const, label: copy.yard }] : []),
  ];
  const species = acceptedSpeciesText(acceptedSpecies);
  const rate = rateTexts(nightlyRate);
  return (
    <Box component="aside" aria-labelledby={id}>
      <Typography
        id={id}
        component="h2"
        sx={{ textTransform: "uppercase", fontSize: 13, fontWeight: 800, letterSpacing: ".06em", mb: 1.5 }}
      >
        {copy.heading}
      </Typography>
      <ListingCardFace
        cover={
          <Stack
            spacing={1}
            sx={{ height: "100%", alignItems: "center", justifyContent: "center", bgcolor: "background.paper" }}
          >
            <HomeIllustration type={homeType === "apartment" ? "apartment" : "house"} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, ...muted }}>{copy.noPhoto}</Typography>
          </Stack>
        }
        host={{ name: firstName || copy.host }}
        title={
          title.trim() || (
            <Box component="span" sx={muted}>
              {copy.title}
            </Box>
          )
        }
        titleComponent="p"
        location={`${address.neighborhood.trim() || copy.neighborhood} · ${address.city.trim() || copy.city}`}
        attributes={attributes}
        price={
          rate ? (
            <>
              <Box component="strong" sx={{ fontSize: 16 }}>
                {rate.rate}
              </Box>
              {copy.nightly}
            </>
          ) : (
            <Box component="span" sx={muted}>
              {copy.noRate}
            </Box>
          )
        }
      >
        {species && (
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {copy.accepts(species, capacityText(capacity))}
          </Typography>
        )}
      </ListingCardFace>
      <Typography sx={{ mt: 2, fontSize: 13, ...muted }}>{copy.help}</Typography>
    </Box>
  );
}

"use client";

import { Box, Button, Typography } from "@mui/material";
import NextLink from "next/link";
import { useWatch } from "react-hook-form";
import { listingCopy } from "../../../lib/listingCopy";
import { ListingSection } from "./ListingSectionHost";
import { ListingYesNo } from "./ListingYesNo";

const copy = listingCopy.household;
/** Pets da casa (spec 023) ainda não estão no ar: o atalho leva para "Meus pets". */
const HOUSE_PETS_PATH = "/pets";

function IntroducePets() {
  const hasDogs = useWatch({ name: "hasDogs" });
  const hasCats = useWatch({ name: "hasCats" });
  if (!hasDogs && !hasCats) return null;
  return (
    <Box>
      <Button component={NextLink} href={HOUSE_PETS_PATH} variant="quiet">
        {copy.introducePets}
      </Button>
      <Typography variant="body2" color="text.secondary">
        {copy.introduceHelp}
      </Typography>
    </Box>
  );
}

/**
 * "Quem mora com você" (REQ-LIST-006): cachorro, gato e criança. Com cachorro ou gato, o atalho "Apresentar quem mora
 * aqui"; o rascunho fica na sessão, então nada se perde na ida.
 *
 * @example <HouseholdSection />
 */
export function HouseholdSection() {
  return (
    <ListingSection id="household">
      {() => (
        <>
          <ListingYesNo name="hasDogs" label={copy.hasDogs} />
          <ListingYesNo name="hasCats" label={copy.hasCats} />
          <ListingYesNo name="hasKids" label={copy.hasKids} />
          <IntroducePets />
        </>
      )}
    </ListingSection>
  );
}

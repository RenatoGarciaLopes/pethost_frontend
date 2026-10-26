"use client";

import { Divider, Stack, Typography } from "@mui/material";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import { listingCopy } from "../../lib/listingCopy";
import { CapacityField, SizesField, SpeciesField } from "./fields/GuestsFields";
import { DescriptionField, HomeTypeField, TitleField } from "./fields/HomeFields";
import { HouseholdFields } from "./fields/HouseholdFields";
import { ListingYesNo } from "./fields/ListingYesNo";
import { RateField, RateSimulation, RulesField, WeekdaysField } from "./fields/StayFields";
import { ListingSection, ListingSectionHost, type ListingSectionHostValue } from "./sections/ListingSectionHost";

/**
 * As sete seções do cantinho aberto, cada uma com o próprio "Salvar" (REQ-LIST-013). Os campos são os mesmos do
 * cadastro em passos (`fields/`), então a edição tem os mesmos controles.
 * @example <ListingSections host={host} />
 */
export function ListingSections({ host }: { host: ListingSectionHostValue }) {
  return (
    <ListingSectionHost value={host}>
      <Stack spacing={5} divider={<Divider />}>
        <ListingSection id="home">
          {host.kind === "person" && <HomeTypeField />}
          <ListingYesNo name="hasYard" label={listingCopy.home.hasYard} />
          <TitleField firstName={host.firstName} />
          <DescriptionField />
        </ListingSection>
        <ListingSection id="household">
          <HouseholdFields />
        </ListingSection>
        <ListingSection id="guests">
          <SpeciesField />
          <SizesField />
          <CapacityField kind={host.kind} />
        </ListingSection>
        <ListingSection id="address">
          <Typography color="text.secondary">{listingCopy.address.help}</Typography>
          <AddressFields name="address" />
        </ListingSection>
        <ListingSection id="rules">
          <RulesField />
        </ListingSection>
        <ListingSection id="weekdays">
          <WeekdaysField />
        </ListingSection>
        <ListingSection id="rate">
          <RateField />
          <RateSimulation />
        </ListingSection>
      </Stack>
    </ListingSectionHost>
  );
}

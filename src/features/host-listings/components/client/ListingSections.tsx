"use client";

import { Stack, Typography } from "@mui/material";
import { AddressFields } from "@/shared/ui/forms/AddressFields";
import type { ListingSectionId } from "../../schemas/listingSchema";
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
 * @example <ListingSections host={host} active="home" />
 */
export function ListingSections({
  host,
  active,
}: {
  host: ListingSectionHostValue;
  active: ListingSectionId | "photos";
}) {
  return (
    <ListingSectionHost value={host}>
      <Stack>
        <ListingSection id="home" visible={active === "home"}>
          {host.kind === "person" && <HomeTypeField />}
          <ListingYesNo name="hasYard" label={listingCopy.home.hasYard} />
          <TitleField firstName={host.firstName} />
          <DescriptionField />
        </ListingSection>
        <ListingSection id="household" visible={active === "household"}>
          <HouseholdFields />
        </ListingSection>
        <ListingSection id="guests" visible={active === "guests"}>
          <SpeciesField />
          <SizesField />
          <CapacityField kind={host.kind} />
        </ListingSection>
        <ListingSection id="address" visible={active === "address"}>
          <Typography color="text.secondary">{listingCopy.address.help}</Typography>
          <AddressFields name="address" />
        </ListingSection>
        <ListingSection id="rules" visible={active === "rules"}>
          <RulesField />
        </ListingSection>
        <ListingSection id="weekdays" visible={active === "weekdays"}>
          <WeekdaysField />
        </ListingSection>
        <ListingSection id="rate" visible={active === "rate"}>
          <RateField />
          <RateSimulation />
        </ListingSection>
      </Stack>
    </ListingSectionHost>
  );
}

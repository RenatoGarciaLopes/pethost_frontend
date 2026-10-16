"use client";

import { Divider, Stack } from "@mui/material";
import { GuestsSection } from "./sections/GuestsSection";
import { HomeSection } from "./sections/HomeSection";
import { HouseholdSection } from "./sections/HouseholdSection";
import { ListingSectionHost, type ListingSectionHostValue } from "./sections/ListingSectionHost";
import { AddressSection, RateSection, RulesSection, WeekdaysSection } from "./sections/SimpleSections";

/**
 * As sete seções do cantinho, na ordem do painel, ligadas a quem as guarda (rascunho ou edição, REQ-LIST-003 e 013).
 * @example <ListingSections host={host} addressSuggested />
 */
export function ListingSections({
  host,
  addressSuggested = false,
}: {
  host: ListingSectionHostValue;
  /** O endereço começou com o da conta (pessoa física, só no rascunho). */
  addressSuggested?: boolean;
}) {
  return (
    <ListingSectionHost value={host}>
      <Stack spacing={5} divider={<Divider />}>
        <HomeSection />
        <HouseholdSection />
        <GuestsSection />
        <AddressSection suggested={addressSuggested} />
        <RulesSection />
        <WeekdaysSection />
        <RateSection />
      </Stack>
    </ListingSectionHost>
  );
}

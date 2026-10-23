"use client";
import { Box, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Notice } from "@/shared/ui/feedback/Notice";
import { searchQueries } from "../../../api/queries";
import { compatibilityWarnings } from "../../../lib/compatibilityLabel";
import { searchCopy } from "../../../lib/searchCopy";
import type { CompatibilityPet } from "../../../types";

/** Quem confere, onde e por quê. @example { accountId, listingId, pet, stay: { checkIn, checkOut }, hostName: "Dona Cida", reasons } */
export interface CompatibilityNoticeProps {
  accountId: string;
  listingId: string;
  pet: CompatibilityPet;
  stay: { checkIn?: string; checkOut?: string };
  /** Quem cuida, para a frase dos outros hóspedes do período. */
  hostName: string;
  /** Motivos do "combina", tirados do que a casa informa; só aparecem sem aviso. */
  reasons: string[];
}

const list = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

/**
 * Caixa "Combina com seu pet" da página do cantinho, a partir de `GET /listings/{id}/compatibility`: verde com
 * "A Pipoca combina com essa casa." e os motivos, ou tracejada (`Notice` de atenção) com cada aviso. Com datas,
 * conta quem mais a casa recebe no período. Enquanto carrega ou se falhar, não mostra nada (não inventa).
 * @example <CompatibilityNotice accountId={user.id} listingId={listing.id} pet={pet} stay={stay} hostName="Dona Cida" reasons={reasons} />
 */
export function CompatibilityNotice({ accountId, listingId, pet, stay, hostName, reasons }: CompatibilityNoticeProps) {
  const { data } = useQuery(searchQueries.compatibility(accountId, listingId, pet.id, stay));
  if (!data) return null;
  const copy = searchCopy.compat;
  const guests = data.guests?.length
    ? copy.guests(
        hostName,
        list.format(
          data.guests.map((guest) =>
            copy.guest(
              guest.name,
              copy.guestSpecies[guest.species] ?? copy.otherPet,
              guest.size ? (copy.guestSizes[guest.size] ?? null) : null,
            ),
          ),
        ),
      )
    : null;
  const match = data.matches || data.warnings.length === 0;
  return (
    <Notice
      tone={match ? "ok" : "atencao"}
      title={match ? copy.houseMatches(data.petName) : copy.houseCheck(data.petName)}
    >
      <Stack spacing={0.5} sx={{ color: "text.primary", fontSize: "0.95rem" }}>
        {match ? (
          reasons.length > 0 && <p>{capitalize(reasons.join(" · "))}.</p>
        ) : (
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {compatibilityWarnings(data).map((text, index) => (
              <li key={`${index}-${text}`}>{text}</li>
            ))}
          </Box>
        )}
        {guests && <p>{guests}</p>}
      </Stack>
    </Notice>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

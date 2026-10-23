"use client";

import { Avatar, Box, Button, ButtonBase, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { nightsBetween, validateStay } from "@/shared/lib/date/stayRules";
import { formatBRL } from "@/shared/lib/money";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { PawMark } from "@/shared/ui/brand/PawMark";
import { DateRangeField } from "@/shared/ui/forms/DateRangeField";
import { stayTotal } from "../../lib/stayTotal";
import { listingPageCopy as copy } from "../../lib/listingPageCopy";
import { NightlyPrice } from "../NightlyPrice";

/** Pet ativo do tutor, como aparece na pílula de "Quem vai". */
export interface StayBookingPet {
  id: string;
  name: string;
  coverUrl: string | null;
}

/** Contexto da estadia que veio da URL. @example { listingId, nightlyRate: 60, hostName: "Dona Cida", today, search: "pets=…&from=…", from, to, petIds: [id], pets } */
export interface StayBookingCardProps {
  listingId: string;
  nightlyRate: number;
  hostName: string;
  /** Hoje em Brasília (vem do servidor, para o campo de datas não depender do relógio do navegador). */
  today: string;
  /** Parâmetros atuais da página, já serializados; o card só troca `from`, `to` e `pets` e preserva o resto. */
  search: string;
  from?: string;
  to?: string;
  petIds: string[];
  /** "Quantos pets" da busca, usado na conta quando nenhum pet foi escolhido. */
  count?: number;
  pets: StayBookingPet[];
}

/**
 * Lateral de reserva do tutor (prancha da página do cantinho): diária, CHEGADA e SAÍDA no `DateRangeField`, "Quem
 * vai" com os pets em pílula (escolhido em amarelo com ✓, os outros tracejados), a conta da estadia, "Pedir
 * estadia" e o recado de pagamento. Cada escolha vai para a URL (`router.replace`), então a compatibilidade e o
 * pedido usam as mesmas datas e pets. No celular o botão sai do card e vai para a barra fixa no rodapé.
 * @example <StayBookingCard {...props} />
 */
export function StayBookingCard({
  listingId,
  nightlyRate,
  hostName,
  today,
  search,
  from = "",
  to = "",
  petIds,
  count,
  pets,
}: StayBookingCardProps) {
  const router = useRouter();
  const [dates, setDates] = useState({ checkIn: from, checkOut: to });
  const [chosen, setChosen] = useState(petIds);
  const params = stayParams(search, dates, chosen);
  const petCount = chosen.length > 0 ? chosen.length : (count ?? 0);
  const total = stayTotal(nightlyRate, dates.checkIn, dates.checkOut, petCount);
  const nights = total ? nightsBetween(dates.checkIn, dates.checkOut) : 0;
  const requestHref = `/listings/${listingId}/request${params.size ? `?${params}` : ""}`;

  function update(nextDates: typeof dates, nextPets: string[]) {
    const next = stayParams(search, nextDates, nextPets);
    router.replace(`/listings/${listingId}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  function changeDates(next: typeof dates) {
    setDates(next);
    const complete =
      next.checkIn && next.checkOut && Object.keys(validateStay(next.checkIn, next.checkOut, today)).length === 0;
    if (complete || (!next.checkIn && !next.checkOut)) update(next, chosen);
  }

  function togglePet(id: string) {
    const next = chosen.includes(id) ? chosen.filter((petId) => petId !== id) : [...chosen, id];
    setChosen(next);
    update(dates, next);
  }

  return (
    <>
      <Stack spacing={2.5}>
        <NightlyPrice nightlyRate={nightlyRate} />
        <DateRangeField checkIn={dates.checkIn} checkOut={dates.checkOut} today={today} onChange={changeDates} />
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 1 }}>
            {copy.whoGoes}
          </Typography>
          {pets.length === 0 ? (
            <Typography variant="body2">
              {copy.noPets}{" "}
              <MuiLink component={Link} href="/pets/new" sx={{ fontWeight: 700, color: "text.primary" }}>
                {copy.newPet}
              </MuiLink>
            </Typography>
          ) : (
            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
              {pets.map((pet) => (
                <PetPill key={pet.id} pet={pet} selected={chosen.includes(pet.id)} onToggle={() => togglePet(pet.id)} />
              ))}
            </Stack>
          )}
        </Box>
        {total && (
          <Stack spacing={1} aria-live="polite" sx={{ borderTop: "2px dashed", borderColor: "divider", pt: 2 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, fontSize: "0.95rem" }}>
              <span>{copy.breakdown(formatBRL(nightlyRate), nights, petCount)}</span>
              <span>{total}</span>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, fontWeight: 700 }}>
              <span>{copy.total}</span>
              <span>{total}</span>
            </Stack>
          </Stack>
        )}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Button component={Link} href={requestHref} variant="contained" fullWidth>
            {copy.request}
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          {copy.payAfter(hostName)} {copy.addressPrivacy}
        </Typography>
      </Stack>
      <Stack
        direction="row"
        sx={{
          display: { xs: "flex", md: "none" },
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          zIndex: "appBar",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 2,
          py: 1.5,
          bgcolor: "background.default",
          borderTop: "2px solid",
          borderColor: "text.primary",
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          {total ?? formatBRL(nightlyRate)}
          <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>
            {total ? ` · ${copy.stayNights(nights)}` : copy.perNight}
          </Box>
        </Typography>
        <Button component={Link} href={requestHref} variant="contained">
          {copy.request}
        </Button>
      </Stack>
    </>
  );
}

/** Pílula de pet: escolhido em gema clara com ✓; os outros, tracejados. É um botão com `aria-pressed`. */
function PetPill({ pet, selected, onToggle }: { pet: StayBookingPet; selected: boolean; onToggle: () => void }) {
  return (
    <ButtonBase
      onClick={onToggle}
      aria-pressed={selected}
      sx={{
        gap: 1,
        minHeight: 44,
        pl: 0.5,
        pr: 1.5,
        fontWeight: 700,
        fontSize: "0.95rem",
        borderRadius: `${quintalRadii.pill}px`,
        border: `2px ${selected ? "solid" : "dashed"}`,
        borderColor: "text.primary",
        bgcolor: selected ? "quintal.luz" : "transparent",
      }}
    >
      <Avatar src={pet.coverUrl ?? undefined} alt="" sx={{ width: 30, height: 30, bgcolor: "background.paper" }}>
        <PawMark size={16} />
      </Avatar>
      {pet.name}
      {selected && <span aria-hidden> ✓</span>}
    </ButtonBase>
  );
}

/** Os parâmetros da página com as datas e os pets da estadia trocados; listas repetem a chave, como na busca. */
function stayParams(search: string, dates: { checkIn: string; checkOut: string }, petIds: string[]) {
  const params = new URLSearchParams(search);
  for (const [key, value] of [
    ["from", dates.checkIn],
    ["to", dates.checkOut],
  ] as const)
    if (value) params.set(key, value);
    else params.delete(key);
  params.delete("pets");
  petIds.forEach((id) => params.append("pets", id));
  return params;
}

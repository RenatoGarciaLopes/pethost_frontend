"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { hasErrorCode } from "@/shared/api/errors/ApiError";
import { applyFieldErrors } from "@/shared/api/errors/applyFieldErrors";
import { earliestRequestCheckIn, nightsBetween } from "@/shared/lib/date/stayRules";
import { formatBRL } from "@/shared/lib/money";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Notice } from "@/shared/ui/feedback/Notice";
import { DateRangeField } from "@/shared/ui/forms/DateRangeField";
import { Surface } from "@/shared/ui/layout/Surface";
import { toBooking } from "../../api/mappers";
import { useRequestBooking } from "../../hooks/useBookingMutations";
import { bookingCopy } from "../../lib/bookingCopy";
import { OWNER_BOOKINGS_PATH, SEARCH_PATH } from "../../lib/bookingPaths";
import { formatDeadline, formatPeriod } from "../../lib/formatStay";
import {
  requestStayErrorMessage,
  requestStaySchema,
  toRequestBookingBody,
  type RequestStayValues,
} from "../../lib/requestStay";
import type { Booking } from "../../types";
import { PetPickCards, type PickablePet } from "./PetPickCards";

const copy = bookingCopy.request;
const FIELDS = ["checkIn", "checkOut", "petIds", "careTermsAccepted"] as const;

/** O cantinho como o pedido mostra (vem da página do cantinho, pela rota). Diária em reais, como a API manda. */
export interface RequestStayListing {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  coverUrl: string | null;
  nightlyRate: number;
  hostName: string | null;
}

export interface RequestStayFormProps {
  accountId: string;
  listing: RequestStayListing;
  /** Pets ativos do tutor, com "combina" já calculado (`petFitsListing`, pela rota). */
  pets: readonly PickablePet[];
  /** Hoje em Brasília (`yyyy-MM-dd`), do servidor. */
  today: string;
  /** Datas e pets da URL; pet que não combina é ignorado. */
  initial: { checkIn: string; checkOut: string; petIds: readonly string[] };
  /** Total formatado (`stayTotal`, pela rota) ou `null` sem período válido ou pet. */
  totalOf: (checkIn: string, checkOut: string, petCount: number) => string | null;
  /** "Agora" para o prazo de resposta; padrão: o momento do envio. */
  now?: Date;
}

/** "Pedido enviado!" com o prazo em Brasília e os dois caminhos (REQ-REQST-006). O foco vai para o título. */
function RequestSent({ booking, hostName, now }: { booking: Booking; hostName: string; now: Date }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Typography ref={headingRef} tabIndex={-1} variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, outline: "none" }}>
        {copy.sent}
      </Typography>
      {booking.responseDeadline && (
        <Typography sx={{ fontWeight: 700 }}>
          {copy.sentDeadline(hostName, formatDeadline(booking.responseDeadline, now))}
        </Typography>
      )}
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Button component={NextLink} href={OWNER_BOOKINGS_PATH} variant="contained">
          {copy.seeStays}
        </Button>
        <Button component={NextLink} href={SEARCH_PATH} variant="outlined">
          {copy.backToSearch}
        </Button>
      </Stack>
    </Stack>
  );
}

/** Capa, título, bairro, período, pets e a conta do total (REQ-REQST-003). */
function RequestSummary({
  listing,
  values,
  pets,
  total,
}: {
  listing: RequestStayListing;
  values: { checkIn: string; checkOut: string; petIds: readonly string[] };
  pets: readonly PickablePet[];
  total: string | null;
}) {
  const headingId = useId();
  const nights = nightsBetween(values.checkIn, values.checkOut);
  const chosen = pets.filter((pet) => values.petIds.includes(pet.id));
  return (
    <Surface component="section" aria-labelledby={headingId} sx={{ p: 2, display: "grid", gap: 1 }}>
      <Typography id={headingId} variant="h2" sx={{ fontSize: 20 }}>
        {copy.summary}
      </Typography>
      {listing.coverUrl ? (
        <Box
          component="img"
          src={listing.coverUrl}
          alt=""
          sx={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: `${quintalRadii.media}px` }}
        />
      ) : (
        <Typography color="text.secondary">{copy.noCover}</Typography>
      )}
      <Typography sx={{ fontWeight: 800 }}>{listing.title}</Typography>
      <Typography color="text.secondary">{`${listing.neighborhood}, ${listing.city}`}</Typography>
      {total && Number.isInteger(nights) && nights > 0 ? (
        <>
          <Typography>{copy.period(formatPeriod(values.checkIn, values.checkOut), nights)}</Typography>
          <Typography>{chosen.map((pet) => pet.name).join(", ")}</Typography>
          <Typography aria-live="polite" sx={{ fontWeight: 800 }}>
            {bookingCopy.stay.bill(formatBRL(listing.nightlyRate), nights, chosen.length, total)}
          </Typography>
        </>
      ) : (
        <Typography aria-live="polite">{copy.choose}</Typography>
      )}
    </Surface>
  );
}

/**
 * "Pedir estadia" do tutor (spec 050, REQ-REQST-002 a 009): datas e pets que vieram da URL, já marcados e mudáveis,
 * o resumo com a conta do total, o checklist "Combinou de levar?" (só na tela) e o aviso de que o pedido não segura a
 * vaga. Envia uma vez só; erro de campo volta ao campo, erro de regra vira frase no topo com o dado da API.
 *
 * @example <RequestStayForm accountId={user.id} listing={listing} pets={pets} today={today} initial={initial} totalOf={totalOf} />
 */
export function RequestStayForm({ accountId, listing, pets, today, initial, totalOf, now }: RequestStayFormProps) {
  const fitting = useMemo(() => new Set(pets.filter((pet) => pet.fit.fits).map((pet) => pet.id)), [pets]);
  const { control, handleSubmit, setError, setValue, formState } = useForm<RequestStayValues>({
    resolver: zodResolver(requestStaySchema(today)),
    defaultValues: {
      checkIn: initial.checkIn,
      checkOut: initial.checkOut,
      petIds: initial.petIds.filter((id) => fitting.has(id)),
      careTermsAccepted: { food: false, meds: false },
    },
  });
  const [checkIn, checkOut, petIds] = useWatch({ control, name: ["checkIn", "checkOut", "petIds"] });
  const request = useRequestBooking(accountId);
  const sending = useRef(false);
  const [sent, setSent] = useState<Booking | null>(null);
  const [notice, setNotice] = useState<{ message: string; listingGone: boolean } | null>(null);
  const hostName = listing.hostName ?? copy.theHost;

  if (sent) return <RequestSent booking={sent} hostName={hostName} now={now ?? new Date()} />;

  async function send(values: RequestStayValues) {
    // Clique duplo antes do botão travar não manda um segundo pedido (REQ-REQST-005).
    if (sending.current) return;
    sending.current = true;
    setNotice(null);
    try {
      setSent(toBooking(await request.mutateAsync(toRequestBookingBody(listing.id, values))));
    } catch (error) {
      if (applyFieldErrors(setError, error, { fields: FIELDS }).length === 0)
        setNotice({
          message: requestStayErrorMessage(error, pets),
          listingGone: hasErrorCode(error, "BOOKING_LISTING_NOT_FOUND"),
        });
    } finally {
      sending.current = false;
    }
  }

  const dateErrors = { checkIn: formState.errors.checkIn?.message, checkOut: formState.errors.checkOut?.message };
  const revalidate = formState.isSubmitted;

  return (
    <Stack component="form" noValidate spacing={4} onSubmit={(event) => void handleSubmit(send)(event)}>
      <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
        {copy.heading}
      </Typography>
      {notice && (
        <Notice
          tone="atencao"
          title={notice.message}
          action={
            notice.listingGone ? (
              <Button component={NextLink} href={SEARCH_PATH} variant="outlined" size="small">
                {copy.backToSearch}
              </Button>
            ) : undefined
          }
        />
      )}
      {formState.errors.root?.server?.message && <Notice tone="erro" title={formState.errors.root.server.message} />}
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ alignItems: "flex-start" }}>
        <Stack spacing={4} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Box component="section">
            <Typography variant="h2" sx={{ fontSize: 22, mb: 1.5 }}>
              {copy.dates}
            </Typography>
            <DateRangeField
              checkIn={checkIn}
              checkOut={checkOut}
              today={today}
              min={earliestRequestCheckIn(today)}
              errors={dateErrors}
              onChange={(range) => {
                setValue("checkIn", range.checkIn, { shouldValidate: revalidate });
                setValue("checkOut", range.checkOut, { shouldValidate: revalidate });
              }}
            />
          </Box>
          {pets.length === 0 ? (
            <Notice
              tone="info"
              title={copy.noPets}
              action={
                <Button component={NextLink} href="/pets/new" variant="outlined" size="small">
                  {copy.addPet}
                </Button>
              }
            />
          ) : (
            <Controller
              control={control}
              name="petIds"
              render={({ field, fieldState }) => (
                <PetPickCards
                  label={copy.pets}
                  pets={pets}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          )}
          <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
            <Typography component="legend" variant="h2" sx={{ fontSize: 22, mb: 1, p: 0 }}>
              {copy.checklist}
            </Typography>
            <Stack>
              {(
                [
                  ["food", copy.food],
                  ["meds", copy.meds],
                ] as const
              ).map(([name, label]) => (
                <Controller
                  key={name}
                  control={control}
                  name={`careTermsAccepted.${name}`}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />
                      }
                      label={label}
                    />
                  )}
                />
              ))}
            </Stack>
            {formState.errors.careTermsAccepted && (
              <Typography role="alert" color="error" sx={{ mt: 0.5 }}>
                {formState.errors.careTermsAccepted.message}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack spacing={2} sx={{ width: { xs: "100%", md: 340 }, flexShrink: 0 }}>
          <RequestSummary
            listing={listing}
            values={{ checkIn, checkOut, petIds }}
            pets={pets}
            total={totalOf(checkIn, checkOut, petIds.length)}
          />
          <Typography>{copy.holdNotice(hostName)}</Typography>
          <Button
            type="submit"
            variant="contained"
            disabled={request.isPending}
            aria-busy={request.isPending || undefined}
          >
            {request.isPending ? copy.sending : copy.submit}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

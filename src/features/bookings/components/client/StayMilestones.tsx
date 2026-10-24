"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useId, useState, type ReactNode } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { brasiliaToday } from "@/shared/lib/date/stayRules";
import { DoorScene, type DoorSceneState } from "@/shared/ui/brand/DoorScene";
import { ConfirmDialog } from "@/shared/ui/feedback/ConfirmDialog";
import { useCheckIn, useCheckOut } from "../../hooks/useBookingMutations";
import { bookingCopy } from "../../lib/bookingCopy";
import { checkInWindow, isCheckInWindow } from "../../lib/stayMilestones";
import type { Booking } from "../../types";

const copy = bookingCopy.milestones;
const arrivalDay = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

/** Botão grande do marco (64 px), ocupado durante o envio. */
function MilestoneButton({ children, busy, onClick }: { children: ReactNode; busy: boolean; onClick: () => void }) {
  return (
    <Button
      variant="contained"
      size="large"
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={onClick}
      sx={{ minHeight: 64, fontSize: "1.2rem", px: 4 }}
    >
      {children}
    </Button>
  );
}

/**
 * A pequena comemoração do marco (REQ-STDAY-002/004): a porta da marca fecha quando o pet chega (ele está dentro) e
 * abre quando volta pra casa; com movimento reduzido, a porta só aparece na posição final. O texto vai em
 * `role="status"`, para o leitor de tela anunciar.
 */
function MilestoneDone({ message, door }: { message: string; door: "closes" | "opens" }) {
  const [state, setState] = useState<DoorSceneState>(door === "closes" ? "open" : "closed");
  useEffect(() => {
    const timer = setTimeout(() => setState(door === "closes" ? "closed" : "wide"), 150);
    return () => clearTimeout(timer);
  }, [door]);
  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      <Box sx={{ width: 200, maxWidth: "100%" }}>
        <DoorScene state={state} />
      </Box>
      <Typography role="status" sx={{ fontWeight: 800, fontSize: "1.25rem" }}>
        {message}
      </Typography>
    </Stack>
  );
}

/** O contato do tutor em destaque enquanto o pet está na casa (REQ-STDAY-003). */
function EmergencyContact({ booking }: { booking: Booking }) {
  const headingId = useId();
  if (!booking.contact?.phone) return null;
  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{
        p: 2,
        borderRadius: `${quintalRadii.card}px`,
        border: "3px solid",
        borderColor: "text.primary",
        bgcolor: "background.paper",
      }}
    >
      <Typography id={headingId} sx={{ fontWeight: 800 }}>
        {copy.emergency}
      </Typography>
      <Typography sx={{ fontSize: "1.25rem", fontWeight: 800 }}>{booking.contact.phone}</Typography>
    </Box>
  );
}

export interface StayMilestonesProps {
  accountId: string;
  booking: Booking;
  /** "Agora" para o dia de Brasília; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * Os marcos da estadia no detalhe do anfitrião (spec 054): "{Pet} chegou" do dia da chegada até a véspera da saída
 * (antes disso, o dia da chegada); em andamento, o contato do tutor em destaque e "{Pet} voltou pra casa", que vale
 * também antes do dia de saída. Cada marco pede confirmação ("não dá pra desfazer": a API não volta atrás) e comemora.
 *
 * @example <StayMilestones accountId={user.id} booking={booking} />
 */
export function StayMilestones({ accountId, booking, now }: StayMilestonesProps) {
  const [today] = useState(() => brasiliaToday(now));
  const checkIn = useCheckIn(accountId, booking.id);
  const checkOut = useCheckOut(accountId, booking.id);
  const [asking, setAsking] = useState<"in" | "out" | null>(null);
  const [done, setDone] = useState<{ message: string; door: "closes" | "opens" } | null>(null);
  const many = booking.pets.length > 1;
  const subject = booking.pets[0]?.name ?? bookingCopy.unknownPet;
  const mutation = asking === "out" ? checkOut : checkIn;

  function confirm() {
    if (asking === "in")
      checkIn.mutate(undefined, {
        onSuccess: () => {
          setAsking(null);
          setDone({ message: copy.arrived(subject, many), door: "closes" });
        },
      });
    else
      checkOut.mutate(undefined, {
        onSuccess: () => {
          setAsking(null);
          setDone({ message: copy.returned(subject, many), door: "opens" });
        },
      });
  }

  const arrival = checkInWindow(booking.checkIn, booking.checkOut, today);

  return (
    <Stack spacing={2}>
      {done && <MilestoneDone message={done.message} door={done.door} />}
      {booking.status === "confirmed" && arrival === "early" && (
        <Typography>{copy.arrivalDay(arrivalDay.format(new Date(`${booking.checkIn}T00:00:00Z`)))}</Typography>
      )}
      {booking.status === "confirmed" && arrival === "closed" && <Typography>{copy.windowClosed}</Typography>}
      {booking.status === "confirmed" && isCheckInWindow(booking.checkIn, booking.checkOut, today) && (
        <Box>
          <MilestoneButton busy={checkIn.isPending} onClick={() => setAsking("in")}>
            {copy.arrive(subject, many)}
          </MilestoneButton>
        </Box>
      )}
      {booking.status === "in_progress" && (
        <>
          <EmergencyContact booking={booking} />
          <Box>
            <MilestoneButton busy={checkOut.isPending} onClick={() => setAsking("out")}>
              {copy.return(subject, many)}
            </MilestoneButton>
          </Box>
        </>
      )}
      <ConfirmDialog
        open={asking !== null}
        title={asking === "out" ? copy.returnTitle(subject, many) : copy.arriveTitle(subject, many)}
        message={copy.irreversible}
        confirmLabel={copy.confirm}
        cancelLabel={copy.keep}
        busy={mutation.isPending}
        error={mutation.isError ? translateError(mutation.error) : null}
        onConfirm={confirm}
        onCancel={() => {
          mutation.reset();
          setAsking(null);
        }}
      />
    </Stack>
  );
}

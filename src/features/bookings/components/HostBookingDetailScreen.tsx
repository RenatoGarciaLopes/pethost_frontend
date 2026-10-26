import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { bookingQueries } from "../api/queries";
import { getBookingDetail } from "../api/server/bookings.server";
import { HostBookingDetail } from "./client/HostBookingDetail";

/**
 * `/host/bookings/{id}` no servidor (spec 053): busca o pedido antes de responder (de outra conta ou inexistente vira o
 * 404 da casca) e entrega o cache hidratado. A ficha dos pets vem pronta da página (widget), porque a feature de
 * reservas não importa a de pets.
 *
 * @example <HostBookingDetailScreen accountId={user.id} bookingId={id} petProfiles={<BookingPetProfiles … />} />
 */
export async function HostBookingDetailScreen({
  accountId,
  bookingId,
  petProfiles,
  conversation,
}: {
  accountId: string;
  bookingId: string;
  petProfiles: ReactNode;
  conversation?: ReactNode;
}) {
  const queryClient = getQueryClient();
  queryClient.setQueryData(
    bookingQueries.detail(accountId, bookingId).queryKey,
    await getBookingDetail(accountId, bookingId),
  );
  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HostBookingDetail
          conversation={conversation}
          accountId={accountId}
          bookingId={bookingId}
          petProfiles={petProfiles}
        />
      </HydrationBoundary>
    </PageContainer>
  );
}

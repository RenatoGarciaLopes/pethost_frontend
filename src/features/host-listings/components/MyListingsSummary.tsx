import { getHostListingProfile, getMyListings } from "../api/server/listings.server";
import { ListingSummaryList } from "./ListingSummaryList";

/**
 * Os cantinhos no painel `/host` (REQ-LIST-001), lidos no servidor (mesma busca do painel das etapas, por `cache()`).
 * Antes de ser anfitrião verificado, ou sem cantinho, não mostra nada.
 *
 * @example <MyListingsSummary accountId={user.id} />
 */
export async function MyListingsSummary({ accountId }: { accountId: string }) {
  const profile = await getHostListingProfile(accountId).catch(() => null);
  if (!profile) return null;
  return <ListingSummaryList mine={await getMyListings(accountId)} />;
}

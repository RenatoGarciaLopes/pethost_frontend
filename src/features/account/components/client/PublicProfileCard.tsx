import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { formatMemberSince } from "@/shared/lib/date/formatMemberSince";
import { InitialsAvatar } from "@/shared/ui/media/InitialsAvatar";
import { accountCopy } from "../../lib/accountCopy";
import type { AccountProfile } from "../../types/accountProfile";

const { profile: copy } = accountCopy;

export interface PublicProfileCardProps {
  profile: AccountProfile;
  /** A foto: o `AvatarUploader` quando a pessoa pode trocar; sem ele, a foto (ou as iniciais) só para ver. */
  photo?: ReactNode;
}

/**
 * O que os outros veem (REQ-ACC-002): foto redonda ou iniciais, nome, bairro e "No PetHost desde {mês de
 * ano}". Sem `memberSince` (anfitrião ainda não aprovado), a linha some.
 *
 * @example <PublicProfileCard profile={profile} photo={<AvatarUploader … />} />
 */
export function PublicProfileCard({ profile, photo }: PublicProfileCardProps) {
  const neighborhood = profile.address?.neighborhood;

  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
      {photo ?? (
        <InitialsAvatar
          name={profile.fullName}
          src={profile.avatarUrl}
          alt={profile.avatarUrl ? profile.fullName : undefined}
          size={96}
        />
      )}
      <Typography variant="h2" sx={{ fontSize: 22 }}>
        {profile.fullName}
      </Typography>
      {neighborhood && <Typography color="text.secondary">{neighborhood}</Typography>}
      {profile.memberSince && (
        <Typography color="text.secondary">{copy.memberSince(formatMemberSince(profile.memberSince))}</Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        {copy.publicCaption}
      </Typography>
    </Stack>
  );
}

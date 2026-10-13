"use client";

import { Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { errorCopy } from "@/shared/api/errors/errorCopy";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { AvatarUploader } from "@/shared/ui/media/AvatarUploader";
import { gatewayFor } from "../../api/client/profileGateway";
import { useAccountProfile } from "../../hooks/useAccountProfile";
import { useRemoveAvatarMutation } from "../../hooks/useRemoveAvatarMutation";
import { useSaveProfileMutation } from "../../hooks/useSaveProfileMutation";
import { useUploadAvatarMutation } from "../../hooks/useUploadAvatarMutation";
import { accountCopy } from "../../lib/accountCopy";
import { ProfileForm } from "./ProfileForm";
import { PublicProfileCard } from "./PublicProfileCard";

const { profile: copy } = accountCopy;
/** Verificação do anfitrião (spec 030); o aviso do anfitrião não aprovado leva para lá (REQ-ACC-011). */
const HOST_APPLICATION_PATH = "/host/application";

export interface ProfileEditorProps {
  userId: string;
  role: PersonalRole;
}

/**
 * `/users/profile` (spec 015): cartão público à esquerda e formulário à direita no computador; no celular,
 * cartão em cima. O perfil chega hidratado do servidor. Salvar ou trocar a foto atualiza o cache e pede
 * `router.refresh()` para a casca mostrar o nome e a foto novos (REQ-ACC-012, 015).
 *
 * @example <ProfileEditor userId={user.id} role="owner" />
 */
export function ProfileEditor({ userId, role }: ProfileEditorProps) {
  const router = useRouter();
  const query = useAccountProfile(userId, role);
  const save = useSaveProfileMutation(userId, role);
  const upload = useUploadAvatarMutation(userId, role);
  const remove = useRemoveAvatarMutation(userId, role);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (query.isPending) return <ProfileSkeleton />;
  if (query.isError)
    return (
      <ErrorState
        title={copy.loadError}
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );

  const profile = query.data;
  const editability = gatewayFor(role).editability(profile);
  const photoBusy = upload.isPending || remove.isPending;

  function reportPhotoError(error: unknown) {
    const tooBig = isApiError(error) && (error.code === "PAYLOAD_TOO_LARGE" || Boolean(error.fieldErrors.file));
    setPhotoError(tooBig ? (errorCopy.PAYLOAD_TOO_LARGE as string) : getErrorMessage(error));
  }

  const photoActions = { onSuccess: () => router.refresh(), onError: reportPhotoError };

  return (
    <Stack spacing={3}>
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 34 } }}>
        {copy.title}
      </Typography>
      {role === "host" && !profile.verified && (
        <Notice
          tone="info"
          action={
            <Button component={NextLink} href={HOST_APPLICATION_PATH} size="small">
              {copy.toVerification}
            </Button>
          }
        >
          {errorCopy.HOST_NOT_FOUND as string}
        </Notice>
      )}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 3, md: 4 },
          gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 280px) minmax(0, 1fr)" },
          alignItems: "start",
        }}
      >
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <PublicProfileCard
            profile={profile}
            photo={
              editability.avatarUrl.mode === "free" ? (
                <AvatarUploader
                  name={profile.fullName}
                  avatarUrl={profile.avatarUrl}
                  busy={photoBusy}
                  error={photoError}
                  onUpload={(file) => {
                    setPhotoError(null);
                    upload.mutate(file, photoActions);
                  }}
                  onRemove={() => {
                    setPhotoError(null);
                    remove.mutate(undefined, photoActions);
                  }}
                />
              ) : undefined
            }
          />
        </Paper>
        <ProfileForm
          profile={profile}
          editability={editability}
          save={(patch) => save.mutateAsync(patch)}
          saving={save.isPending}
          onSaved={() => router.refresh()}
        />
      </Box>
    </Stack>
  );
}

/** Esqueleto do cartão e dos campos enquanto o perfil carrega (fora da hidratação, ex.: depois de um erro). */
function ProfileSkeleton() {
  return (
    <Stack spacing={2} aria-busy="true">
      <Skeleton variant="circular" width={96} height={96} />
      {[0, 1, 2, 3].map((row) => (
        <Skeleton key={row} variant="rounded" height={56} />
      ))}
    </Stack>
  );
}

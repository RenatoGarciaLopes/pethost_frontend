import { Avatar, type AvatarProps } from "@mui/material";
import { initialsOf } from "@/shared/lib/text/initials";
import type { avatarTones } from "@/shared/theme/tokens/semantic";

/** Dados legados do storage local não podem iniciar requests ao dispositivo de visitantes. */
function avatarSource(src: string | null | undefined): string | undefined {
  if (!src || process.env.NODE_ENV !== "production") return src ?? undefined;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src.startsWith("//") ? `https:${src}` : src);
    const host = url.hostname.toLowerCase();
    const local =
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      !host.includes(".") ||
      host.includes(":") ||
      /^(?:0|10|127)\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(?:1[6-9]|2\d|3[01])\./.test(host);
    return !local && (url.protocol === "https:" || url.protocol === "http:") ? src : undefined;
  } catch {
    return undefined;
  }
}

export interface InitialsAvatarProps extends Omit<AvatarProps, "children" | "src"> {
  /** Nome usado apenas para gerar o fallback; não é reescrito para exibição. */
  name: string;
  /** Foto opcional. O MUI usa as mesmas iniciais se ela falhar. */
  src?: string | null;
  /** Diâmetro em pixels; 40 por padrão. Os consumidores escolhem somente geometria. */
  size?: number;
  /** Coral recomendado ou café para comparação de revisão; ambos passam AA com branco. */
  tone?: keyof typeof avatarTones;
}

/**
 * Avatar humano compartilhado com foto opcional e iniciais brancas sobre fundo AA.
 * Usar em cabeçalho, perfis e reservas; não substitui os avatares/ícones de pets.
 * Herda props MUI e sx. Foto é decorativa por padrão (alt=""); para avatar isolado,
 * fornecer alt ou role="img" com aria-label. Não faz upload nem busca dados.
 * @example <InitialsAvatar name="Ana Souza (teste)" src={avatarUrl} size={32} />
 */
export function InitialsAvatar({
  name,
  src,
  size = 40,
  tone = "coral",
  sx = [],
  alt = "",
  ...props
}: InitialsAvatarProps) {
  return (
    <Avatar
      {...props}
      src={avatarSource(src)}
      alt={alt}
      sx={[
        {
          width: size,
          height: size,
          fontSize: size >= 80 ? 32 : size < 40 ? 14 : 20,
          fontWeight: 700,
          bgcolor: `avatar.${tone}.background`,
          color: `avatar.${tone}.foreground`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {initialsOf(name)}
    </Avatar>
  );
}

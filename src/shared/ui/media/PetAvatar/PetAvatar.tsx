import { Avatar, type AvatarProps } from "@mui/material";
import { quintalColors as c } from "@/shared/theme/tokens/colors";

export interface PetAvatarProps extends Omit<AvatarProps, "children" | "src" | "id"> {
  /** Identidade estável; no cadastro, use uma chave de rascunho. */
  petId: string;
  name: string;
  species?: string | null;
  src?: string | null;
  size?: number;
}

/** Foto do pet ou desenho local da espécie. Não consulta dados nem faz upload.
 * O hash do id conserva a mesma pelagem em qualquer tela, inclusive SSR.
 * O desenho é decorativo; o contêiner recebe o nome acessível.
 * @example <PetAvatar petId={pet.id} name={pet.name} species={pet.species} src={pet.coverUrl} />
 */
export function PetAvatar({ petId, name, species, src, size = 40, sx = [], ...props }: PetAvatarProps) {
  const variant = Array.from(petId).reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 0) % 4;
  const group =
    species === "dog" || species === "cat"
      ? species
      : ["cockatiel", "parrot", "parakeet", "canary"].includes(species ?? "")
        ? "bird"
        : ["hamster", "guinea_pig"].includes(species ?? "")
          ? "rodent"
          : ["rabbit", "fish", "turtle"].includes(species ?? "")
            ? species
            : "other";
  const coat = (group === "dog" ? [c.gema, c.tinta, c.papel, c.texto2] : [c.gema, c.texto2, c.papel, c.coral])[variant];
  const face = variant === 1 ? c.papel : c.tinta;
  return (
    <Avatar
      {...props}
      src={src || undefined}
      alt=""
      role="img"
      aria-label={name}
      sx={[{ width: size, height: size, flexShrink: 0, bgcolor: c.papel }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <svg aria-hidden="true" viewBox="0 0 64 64" width="100%" height="100%" focusable="false">
        <circle
          cx="32"
          cy="32"
          r="32"
          fill={group === "fish" || group === "cat" ? c.ceu : group === "turtle" || group === "bird" ? c.grama : c.luz}
          fillOpacity="0.35"
        />
        <g stroke={c.tinta} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {(group === "dog" || group === "cat") && (
            <>
              {group === "dog" ? (
                <path
                  d={
                    variant % 2 === 0
                      ? "M20 21C8 13 5 26 10 42Q13 47 21 36M44 21C56 13 59 26 54 42Q51 47 43 36"
                      : "M20 22C8 15 5 29 12 43Q16 46 22 35M44 22C56 15 59 29 52 43Q48 46 42 35"
                  }
                  fill={variant === 3 ? c.tinta : coat}
                />
              ) : (
                <path d="M15 29L14 11L29 21M49 29L50 11L35 21" fill={coat} />
              )}
              <path d="M15 31Q15 19 32 19Q49 19 49 31L48 42Q46 54 32 54Q18 54 16 42Z" fill={coat} />
              {variant === 2 && <path d="M17 29Q20 18 29 21L27 35Q19 39 17 29Z" fill={c.texto2} />}
              {group === "cat" && variant === 3 && <path d="M28 20L30 28M36 20L34 28" />}
              <g stroke={face} fill={face}>
                <circle cx="24" cy="34" r="1.4" />
                <circle cx="40" cy="34" r="1.4" />
                {group === "cat" && (
                  <>
                    <path d="M29 41Q32 44 35 41Z" />
                    <path d="M32 44Q28 49 25 45M32 44Q36 49 39 45" fill="none" />
                  </>
                )}
              </g>
              {group === "dog" && (
                <>
                  <ellipse cx="32" cy="44" rx="12" ry="9" fill={variant === 0 ? c.luz : c.cartao} />
                  <path d="M27 39Q32 36 37 39Q37 43 32 45Q27 43 27 39Z" fill={c.tinta} />
                  <path d="M32 45V48M32 48Q27 52 25 48M32 48Q37 52 39 48" fill="none" />
                </>
              )}
              {group === "cat" && <path d="M13 39L23 41M13 45L23 44M51 39L41 41M51 45L41 44" />}
              {group === "dog" && variant === 0 && <path d="M30 48Q32 57 35 48" fill={c.coral} />}
            </>
          )}
          {group === "rabbit" && (
            <>
              <path d="M22 29C8 1 28 1 29 27M35 27C36 1 56 1 42 29" fill={c.papel} />
              <path d="M23 20L21 12M41 20L43 12" stroke={c.coral} />
              <ellipse cx="32" cy="40" rx="19" ry="16" fill={c.papel} />
              <path d="M23 37v1M41 37v1M29 44L32 46L35 44M32 46v4" />
            </>
          )}
          {group === "rodent" && (
            <>
              <circle cx="17" cy="22" r="9" fill={c.coral} />
              <circle cx="47" cy="22" r="9" fill={c.coral} />
              <path d="M13 36Q13 20 32 22Q51 20 51 36V42Q49 55 32 55Q15 55 13 42Z" fill={c.gema} />
              <ellipse cx="32" cy="44" rx="13" ry="10" fill={c.papel} />
              <path d="M22 35v1M42 35v1M29 41L32 44L35 41M32 44v5" />
            </>
          )}
          {group === "bird" && (
            <>
              <path d="M22 20L27 10L33 19L40 12L39 22" fill={c.coral} />
              <path d="M14 36Q14 19 32 20Q50 19 50 36V42Q47 55 32 55Q17 55 14 42Z" fill={c.gema} />
              <path d="M24 33v1M40 33v1M26 40L32 47L38 40Z" fill={c.coral} />
              <circle cx="20" cy="41" r="3" fill={c.coral} stroke="none" />
              <circle cx="44" cy="41" r="3" fill={c.coral} stroke="none" />
            </>
          )}
          {group === "fish" && (
            <>
              <path d="M42 30L55 21V47L42 40M24 24L30 16L37 25" fill={c.coral} />
              <ellipse cx="28" cy="35" rx="18" ry="14" fill={c.gema} />
              <circle cx="20" cy="32" r="2" fill={c.tinta} />
              <path d="M32 29Q26 35 32 41M11 38h5" fill="none" />
            </>
          )}
          {group === "turtle" && (
            <>
              <ellipse cx="32" cy="39" rx="22" ry="15" fill={c.grama} />
              <path d="M19 49L15 54M45 49L49 54M25 33L32 28L39 33V42L32 47L25 42Z" fill={c.gema} />
              <ellipse cx="32" cy="23" rx="12" ry="11" fill={c.grama} />
              <path d="M27 21v1M37 21v1M28 27Q32 30 36 27" fill="none" />
            </>
          )}
          {group === "other" && (
            <g fill={c.coral}>
              <ellipse cx="18" cy="25" rx="5" ry="7" transform="rotate(-25 18 25)" />
              <ellipse cx="30" cy="19" rx="5" ry="7" />
              <ellipse cx="43" cy="24" rx="5" ry="7" transform="rotate(25 43 24)" />
              <path d="M17 44Q17 38 24 35Q31 25 38 35Q49 38 47 46Q45 52 36 49Q31 47 25 50Q17 53 17 44Z" />
            </g>
          )}
        </g>
      </svg>
    </Avatar>
  );
}

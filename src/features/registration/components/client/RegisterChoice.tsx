"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { quintalColors as c } from "@/shared/theme/tokens/colors";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { hardShadow } from "@/shared/theme/tokens/shadows";
import { registrationCopy } from "../../lib/registrationCopy";

export interface RegisterChoiceProps {
  role: PersonalRole;
  onChoose: (role: PersonalRole) => void;
}

/** Cartões de navegação entre cadastros, dentro do passo 1. Não são radios de um corpo da API.
 * @example <RegisterChoice role="owner" onChoose={changeRole} />
 */
export function RegisterChoice({ role, onChoose }: RegisterChoiceProps) {
  return (
    <Box
      role="group"
      aria-label={registrationCopy.choice.legend}
      sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}
    >
      {(["owner", "host"] as const).map((option) => {
        const selected = role === option;
        return (
          <ButtonBase
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChoose(option)}
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              minHeight: 152,
              p: 2.5,
              border: "2px solid",
              borderColor: "text.primary",
              borderRadius: `${quintalRadii.field}px`,
              bgcolor: selected ? "success.main" : "background.paper",
              boxShadow: hardShadow(selected ? 0 : 3),
              color: "text.primary",
              textAlign: "center",
              width: "100%",
            }}
          >
            <RoleIllustration role={option} />
            <Typography component="span" sx={{ fontSize: 18, fontWeight: 800 }}>
              {registrationCopy.choice[option].label}
            </Typography>
            <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
              {registrationCopy.choice[option].description}
            </Typography>
            {selected && (
              <Box
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  bgcolor: "text.primary",
                  color: "success.main",
                  fontWeight: 800,
                }}
              >
                ✓
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/** Desenhos decorativos da mala com pet e da casa; rótulos dos cartões carregam a informação. */
function RoleIllustration({ role }: { role: PersonalRole }) {
  return (
    <svg
      viewBox="0 0 64 52"
      width="56"
      height="46"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={c.tinta}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {role === "owner" ? (
        <>
          <rect x="8" y="15" width="34" height="30" rx="5" fill={c.ceu} />
          <path d="M18 15V9q0-4 4-4h6q4 0 4 4v6M8 27h34" />
          <circle cx="49" cy="34" r="10" fill={c.gema} />
          <path d="M46 36q3-7 6 0q0 4-6 0M43 30h0m5-3h0m5 2h0m2 5h0" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M8 22 32 5l24 17Z" fill={c.gema} />
          <path d="M13 22h38v26H13Z" fill="white" />
          <path d="M25 48V34a7 7 0 0 1 14 0v14" fill={c.coral} />
        </>
      )}
    </svg>
  );
}

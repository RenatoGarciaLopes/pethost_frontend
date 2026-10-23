"use client";

import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import NextLink from "next/link";
import { useId, useState } from "react";
import { useLinkedAccounts } from "@/features/auth/index.client";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { roleLabel } from "@/shared/config/roleLabels";
import { initialsOf } from "@/shared/lib/text/initials";
import { visuallyHidden } from "@/shared/ui/a11y/visuallyHidden";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { useLogout } from "../../hooks/useLogout";
import { accountLabel } from "../../lib/accountLabel";
import { shellCopy } from "../../lib/shellCopy";

/** Perfil, senha e pausar conta (spec 015) começam pelo perfil. */
const MY_ACCOUNT_PATH = "/users/profile";
const SWITCH_PATH = "/users/switch";

export interface AccountMenuProps {
  /** Só o que o menu mostra; o resto da conta não vai para o navegador. */
  user: { id: string; fullName: string; role: AccountRole; avatarUrl: string | null };
}

/**
 * Menu da conta (REQ-SHELL-003 a 005): pílula com foto ou iniciais e o primeiro nome (no celular, só o avatar,
 * REQ-SHELL-006), nome completo e a conta atual no menu; "Minha conta" e, quando a outra
 * conta existe e está ativa, "Trocar pra conta de …" (spec 014). As contas vinculadas só são buscadas quando o
 * menu abre pela primeira vez; falha esconde o item e o resto do menu continua. "Sair" sai mesmo com a API
 * fora do ar. Admin não tem conta vinculada nem "Minha conta".
 *
 * @example <AccountMenu user={{ id, fullName: "Camila Souza", role: "owner", avatarUrl: null }} />
 */
export function AccountMenu({ user }: AccountMenuProps) {
  const menuId = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [opened, setOpened] = useState(false);
  const personal = user.role !== "admin";
  const linked = useLinkedAccounts(user.id, { enabled: personal && opened });
  const { logout, isPending } = useLogout();
  // Admin nunca troca, mesmo se o cache tiver contas (a consulta desligada ainda devolve o que já está nele).
  const other = personal ? linked.data?.find((account) => !account.isCurrent && account.isActive) : undefined;

  function open(element: HTMLElement) {
    setAnchor(element);
    setOpened(true);
  }

  return (
    <>
      <IconButton
        onClick={(event) => open(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        aria-controls={anchor ? menuId : undefined}
        sx={{
          p: 0.5,
          pr: { md: 1.5 },
          gap: 1,
          minHeight: 48,
          color: "text.primary",
          border: "2px solid",
          borderColor: "text.primary",
          borderRadius: `${quintalRadii.pill}px`,
        }}
      >
        {/* O nome do botão começa pelas iniciais visíveis e segue com o texto escondido (WCAG 2.5.3). */}
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt=""
          sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 32, height: 32 }}
        >
          {initialsOf(user.fullName)}
        </Avatar>{" "}
        <Typography component="span" sx={{ fontWeight: 700, display: { xs: "none", md: "inline" } }}>
          {user.fullName.split(" ")[0]}
        </Typography>{" "}
        <Box component="span" sx={visuallyHidden}>
          {shellCopy.menu(user.fullName)}
        </Box>
      </IconButton>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{user.fullName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {accountLabel(user.role)}
          </Typography>
        </Box>
        <Divider />
        {personal && (
          <MenuItem component={NextLink} href={MY_ACCOUNT_PATH} onClick={() => setAnchor(null)}>
            {shellCopy.myAccount}
          </MenuItem>
        )}
        {other && (
          <MenuItem component={NextLink} href={`${SWITCH_PATH}?to=${other.role}`} onClick={() => setAnchor(null)}>
            {shellCopy.switchTo(roleLabel(other.role))}
          </MenuItem>
        )}
        {/* Espaço do item de troca enquanto as contas chegam: o menu não pula. */}
        {personal && linked.isFetching && !linked.data && <Box aria-hidden sx={{ height: 36 }} />}
        <MenuItem onClick={logout} disabled={isPending}>
          {isPending ? shellCopy.loggingOut : shellCopy.logout}
        </MenuItem>
      </Menu>
    </>
  );
}

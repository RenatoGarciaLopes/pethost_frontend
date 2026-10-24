"use client";

import { Avatar, Box, IconButton, Typography } from "@mui/material";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { conversationsCopy } from "../../../lib/conversationsCopy";

export interface ConversationHeaderProps {
  /** Nome de quem está do outro lado. É o título da conversa (`h2`). */
  name: string;
  /** Foto de quem está do outro lado; sem foto, a inicial do nome. */
  avatarUrl: string | null;
  /** Linha de apoio embaixo do nome (ex.: "Casa da Dona Cida · Jd. Alvorada"). */
  subtitle?: string;
  /** Conteúdo à direita no computador (ex.: o selo "Pipoca aqui · dia 2 de 5"). Some no celular. */
  aside?: ReactNode;
  /** Volta para a lista. Só aparece no celular, onde a lista e a conversa não cabem juntas (REQ-CHAT-012). */
  backHref?: string;
}

/**
 * O topo da conversa aberta (spec 055): foto, nome e a linha de apoio, com um espaço à direita para o contexto.
 * No celular, ganha a seta para voltar à lista.
 *
 * Use no topo do painel da conversa. Não use como cabeçalho da página: o título da página é "Conversas".
 *
 * @example <ConversationHeader name="Dona Cida" avatarUrl={null} subtitle="Casa da Dona Cida · Jd. Alvorada" backHref="/conversations" />
 */
export function ConversationHeader({ name, avatarUrl, subtitle, aside, backHref }: ConversationHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: { xs: 1.5, md: 2.5 },
        py: 1.5,
        borderBottom: "2px solid",
        borderColor: "text.primary",
      }}
    >
      {backHref && (
        <IconButton
          component={NextLink}
          href={backHref}
          aria-label={conversationsCopy.back}
          sx={{ display: { xs: "inline-flex", md: "none" }, width: 44, height: 44, color: "text.primary" }}
        >
          <Box component="span" aria-hidden sx={{ fontSize: 22, lineHeight: 1 }}>
            ←
          </Box>
        </IconButton>
      )}
      <Avatar
        src={avatarUrl ?? undefined}
        alt=""
        sx={{ width: 44, height: 44, border: "2px solid", borderColor: "text.primary", bgcolor: "ceu.main" }}
      >
        {name.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.3 }}>
          {name}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {aside && <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>{aside}</Box>}
    </Box>
  );
}

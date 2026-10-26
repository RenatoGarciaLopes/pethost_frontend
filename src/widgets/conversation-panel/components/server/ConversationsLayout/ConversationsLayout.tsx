import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { conversationsCopy } from "@/features/conversations";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { PageContainer } from "@/shared/ui/layout/PageContainer";
import { quintalRadii } from "@/shared/theme/tokens/radii";

export interface ConversationsLayoutProps {
  /** A lista de conversas (coluna da esquerda). */
  list: ReactNode;
  /** A conversa aberta (coluna da direita); sem ela, o computador pede para escolher uma. */
  panel?: ReactNode;
  /**
   * O que o celular mostra, já que as duas colunas não cabem: `list` em `/conversations`, `panel` na conversa aberta
   * (REQ-CHAT-012). No computador, as duas aparecem sempre.
   */
  focus: "list" | "panel";
}

/** Altura do cabeçalho da casca (`AppHeader`): o painel ocupa o resto da tela e rola por dentro. */
const HEADER_HEIGHT = { xs: 74, md: 80 } as const;

/**
 * A página de Conversas (spec 055): título sobre a lista à esquerda e a conversa à direita, em largura de página. A conversa
 * ocupa a altura da tela e só as mensagens rolam. No celular mostra uma coisa por vez, sem margens na conversa.
 *
 * Use como corpo de `/conversations` e `/conversations/[conversationId]`, dentro da casca. Não use para outras listas
 * com detalhe.
 *
 * @example <ConversationsLayout focus="panel" list={<ConversationList … />} panel={<ConversationPanel … />} />
 */
export function ConversationsLayout({ list, panel, focus }: ConversationsLayoutProps) {
  const listOnPhone = focus === "list";
  return (
    <PageContainer
      width="page"
      sx={{
        px: { xs: listOnPhone ? 2 : 0, md: 4 },
        py: { xs: listOnPhone ? 3 : 0, md: 4 },
      }}
    >
      <Typography
        variant="h1"
        sx={{ display: { xs: listOnPhone ? "block" : "none", md: "block" }, fontSize: { xs: 32, md: 36 }, mb: 3 }}
      >
        {conversationsCopy.heading}
      </Typography>
      <Box
        sx={{
          display: { xs: "block", md: "grid" },
          gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
          gap: 3,
          height: { md: `max(360px, calc(100dvh - var(--app-header-height, ${HEADER_HEIGHT.md}px) - 132px))` },
        }}
      >
        <Box
          component="section"
          aria-label={conversationsCopy.listLabel}
          sx={{
            display: { xs: listOnPhone ? "flex" : "none", md: "flex" },
            flexDirection: "column",
            minHeight: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: `${quintalRadii.card}px`,
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          <Typography
            component="h2"
            variant="subtitle1"
            sx={{ fontWeight: 700, px: 2, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
          >
            {conversationsCopy.listLabel}
          </Typography>
          <Box sx={{ p: 1, overflowY: "auto", minHeight: 0 }}>{list}</Box>
        </Box>
        <Box
          sx={{
            display: { xs: listOnPhone ? "none" : "block", md: "block" },
            height: {
              xs: `calc(100dvh - var(--app-header-height, ${HEADER_HEIGHT.xs}px))`,
              md: "100%",
            },
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {panel ?? (
            <Box
              component="section"
              aria-label={conversationsCopy.pickConversation.title}
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: `${quintalRadii.card}px`,
                bgcolor: "background.paper",
                px: { md: 3 },
              }}
            >
              <EmptyState
                title={conversationsCopy.pickConversation.title}
                description={conversationsCopy.pickConversation.description}
              />
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}

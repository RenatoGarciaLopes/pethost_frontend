import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { conversationsCopy } from "@/features/conversations";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { PageContainer } from "@/shared/ui/layout/PageContainer";

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
 * A página de Conversas (spec 055): título e lista à esquerda, a conversa à direita, em largura de página. A conversa
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
        display: { xs: "block", md: "grid" },
        gridTemplateColumns: "minmax(280px, 360px) 1fr",
        columnGap: 4,
        alignItems: "start",
        px: { xs: listOnPhone ? 2 : 0, md: 4 },
        py: { xs: listOnPhone ? 3 : 0, md: 4 },
      }}
    >
      <Box sx={{ display: { xs: listOnPhone ? "block" : "none", md: "block" } }}>
        <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 36 }, mb: 3 }}>
          {conversationsCopy.heading}
        </Typography>
        {list}
      </Box>
      <Box
        sx={{
          display: { xs: listOnPhone ? "none" : "block", md: "block" },
          height: {
            xs: `calc(100dvh - ${HEADER_HEIGHT.xs}px)`,
            md: `calc(100dvh - ${HEADER_HEIGHT.md}px - 64px)`,
          },
          minHeight: { md: 520 },
        }}
      >
        {panel ?? (
          <EmptyState
            title={conversationsCopy.pickConversation.title}
            description={conversationsCopy.pickConversation.description}
          />
        )}
      </Box>
    </PageContainer>
  );
}

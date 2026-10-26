import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { conversationPath, conversationsCopy, isConversationId } from "@/features/conversations";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { ConversationsScreen } from "@/widgets/conversation-panel/index.server";

export const metadata: Metadata = {
  title: conversationsCopy.pageTitle,
  robots: { index: false, follow: false },
};

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

/** `/conversations/{id}` (spec 055): a conversa aberta ao lado da lista; id que não é UUID vira 404. */
export default function ConversationPage(props: ConversationPageProps) {
  return (
    <Suspense fallback={<SniffLoader label={conversationsCopy.loadingConversation} />}>
      <ConversationContent {...props} />
    </Suspense>
  );
}

async function ConversationContent({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  if (!isConversationId(conversationId)) notFound();
  const user = await requirePersonalUser(conversationPath(conversationId));
  return <ConversationsScreen accountId={user.id} viewer={user.role} conversationId={conversationId} />;
}

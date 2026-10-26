import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { conversationPath, conversationsCopy, isConversationId } from "@/features/conversations";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { ConversationContent } from "@/widgets/conversation-panel/index.server";
import ConversationLoading from "./loading";

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
    <Suspense fallback={<ConversationLoading />}>
      <ConversationPageContent {...props} />
    </Suspense>
  );
}

async function ConversationPageContent({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  if (!isConversationId(conversationId)) notFound();
  const user = await requirePersonalUser(conversationPath(conversationId));
  return <ConversationContent accountId={user.id} viewer={user.role} conversationId={conversationId} />;
}

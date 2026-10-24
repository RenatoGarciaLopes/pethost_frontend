import type { Metadata } from "next";
import { Suspense } from "react";
import { conversationsCopy } from "@/features/conversations";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { ConversationsScreen } from "@/widgets/conversation-panel/index.server";

export const metadata: Metadata = {
  title: conversationsCopy.pageTitle,
  robots: { index: false, follow: false },
};

/** `/conversations` (spec 055): as conversas do tutor ou do anfitrião; admin vai para a casa dele. */
export default function ConversationsPage() {
  return (
    <Suspense fallback={<SniffLoader label={conversationsCopy.loadingList} />}>
      <ConversationsContent />
    </Suspense>
  );
}

async function ConversationsContent() {
  const user = await requirePersonalUser("/conversations");
  return <ConversationsScreen accountId={user.id} viewer={user.role} />;
}

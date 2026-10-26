import { Suspense, type ReactNode } from "react";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { conversationsCopy } from "@/features/conversations";
import { ConversationsScreen } from "@/widgets/conversation-panel/index.server";

export default function ConversationsRouteLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SniffLoader label={conversationsCopy.loadingList} />}>
      <AuthenticatedConversations>{children}</AuthenticatedConversations>
    </Suspense>
  );
}

async function AuthenticatedConversations({ children }: { children: ReactNode }) {
  const user = await requirePersonalUser("/conversations");
  return (
    <ConversationsScreen accountId={user.id} viewer={user.role}>
      {children}
    </ConversationsScreen>
  );
}

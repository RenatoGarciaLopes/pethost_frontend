import type { Metadata } from "next";
import { conversationsCopy } from "@/features/conversations";

export const metadata: Metadata = {
  title: conversationsCopy.pageTitle,
  robots: { index: false, follow: false },
};

/** `/conversations` (spec 055): as conversas do tutor ou do anfitrião; admin vai para a casa dele. */
export default function ConversationsPage() {
  return null;
}

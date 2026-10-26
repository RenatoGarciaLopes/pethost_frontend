import { conversationStream } from "@/features/conversations/index.server";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return conversationStream(request);
}

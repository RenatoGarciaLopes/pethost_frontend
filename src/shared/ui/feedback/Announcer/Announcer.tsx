"use client";

import { Box } from "@mui/material";
import { createContext, use, useState, type ReactNode } from "react";

type Announce = (message: string) => void;

const AnnounceContext = createContext<Announce | null>(null);

/**
 * Região viva da página inteira: fica no `AppProviders`, acima dos grupos de rota, então o aviso continua
 * de pé quando a rota muda (spec 014, REQ-SWITCH-006: "Agora você está na conta de…" depois de navegar).
 * Uma frase por vez, educada (`polite`); o texto fica escondido da tela e só o leitor de tela lê.
 *
 * @example <AnnouncerProvider>{children}</AnnouncerProvider>
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  // A contagem muda a `key`: a mesma frase repetida vira um nó novo e é lida de novo.
  const [announcement, setAnnouncement] = useState({ message: "", count: 0 });

  return (
    <AnnounceContext value={(message) => setAnnouncement(({ count }) => ({ message, count: count + 1 }))}>
      {children}
      <Box role="status" aria-live="polite" sx={visuallyHidden}>
        <span key={announcement.count}>{announcement.message}</span>
      </Box>
    </AnnounceContext>
  );
}

/**
 * Anuncia uma frase na região viva do app. Precisa do `AnnouncerProvider` (já está no `AppProviders`).
 *
 * @throws {Error} fora do `AnnouncerProvider`
 * @example const announce = useAnnounce(); announce("Agora você está na conta de anfitrião.");
 */
export function useAnnounce(): Announce {
  const announce = use(AnnounceContext);
  if (!announce) throw new Error("useAnnounce precisa do AnnouncerProvider");
  return announce;
}

const visuallyHidden = {
  position: "absolute",
  // Em px: no `sx` do MUI, `1` significa 100%.
  width: "1px",
  height: "1px",
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

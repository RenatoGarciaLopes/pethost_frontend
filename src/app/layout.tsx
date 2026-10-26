import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { TURMA_MEMBERS, turmaSrc } from "@/shared/ui/brand/turma";
import localFont from "next/font/local";
import { AppProviders } from "@/bootstrap/providers/AppProviders";
import "./globals.css";

const caprasimo = localFont({
  src: "../../public/fonts/caprasimo-latin-400-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});
const atkinsonHyperlegibleNext = localFont({
  src: [
    { path: "../../public/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/atkinson-hyperlegible-next-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/atkinson-hyperlegible-next-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pethost.cfd"),
  title: "PetHost",
  description: "Hospedagem de pets perto de casa.",
  openGraph: { type: "website", siteName: "PetHost", locale: "pt_BR" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  for (const member of TURMA_MEMBERS) preload(turmaSrc(member), { as: "image", fetchPriority: "high" });
  return (
    <html lang="pt-BR" className={`${caprasimo.variable} ${atkinsonHyperlegibleNext.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

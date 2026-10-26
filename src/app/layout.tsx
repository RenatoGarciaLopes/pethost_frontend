import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { AppProviders } from "@/bootstrap/providers/AppProviders";
import "./globals.css";

const caprasimo = localFont({
  src: "../assets/fonts/caprasimo-latin-400-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
});
const atkinsonHyperlegibleNext = localFont({
  src: [
    { path: "../assets/fonts/atkinson-hyperlegible-next-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/atkinson-hyperlegible-next-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../assets/fonts/atkinson-hyperlegible-next-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PetHost",
  description: "Hospedagem de pets perto de casa.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${caprasimo.variable} ${atkinsonHyperlegibleNext.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

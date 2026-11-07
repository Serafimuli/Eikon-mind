import type { Metadata } from "next";
import Script from "next/script";
import { BackToTop } from "@/components/BackToTop";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://eikon-mind.ro"),
  title: { default: "Eikon Mind", template: "%s | Eikon Mind" },
  description: "Psihoterapie și consiliere în Iași și online",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        {children}
        <BackToTop />
        <BackgroundMusic />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

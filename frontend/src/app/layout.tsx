import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://eikon-mind.ro"),
  title: { default: "Eikon Mind", template: "%s | Eikon Mind" },
  description: "Psihoterapie și consiliere în Iași și online",
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const locale = requestHeaders.get("x-locale") === "en" ? "en" : "ro";
  const themeScript =
    "try{const theme=localStorage.getItem('eikon-theme');if(theme==='dark'){document.documentElement.classList.add('dark')}document.documentElement.style.colorScheme=theme==='dark'?'dark':'light'}catch(e){}";
  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        {children}
        <BackgroundMusic />
        <Script id="eikon-theme" nonce={nonce} strategy="beforeInteractive">
          {themeScript}
        </Script>
      </body>
    </html>
  );
}

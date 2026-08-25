import type { Metadata } from "next"
import { headers } from "next/headers"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://eikon-mind.ro"),
  title: { default: "Eikon Mind", template: "%s | Eikon Mind" },
  description: "Psihoterapie și consiliere în Iași și online",
  robots: { index: true, follow: true },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined
  const themeScript = "try{const theme=localStorage.getItem('eikon-theme');if(theme==='dark'){document.documentElement.classList.add('dark')}document.documentElement.style.colorScheme=theme==='dark'?'dark':'light'}catch(e){}"
  return <html lang="ro" suppressHydrationWarning><head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>
}

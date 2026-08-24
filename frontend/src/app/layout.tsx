import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://eikon-mind.ro"),
  title: { default: "Eikon Mind", template: "%s | Eikon Mind" },
  description: "Psihoterapie și consiliere în Iași și online",
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ro" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('eikon-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}" }} /></head><body>{children}</body></html>
}


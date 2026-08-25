import Image from "next/image"
import Link from "next/link"
import { site, type Locale } from "@/lib/site-content"

const serviceSlugs = ["adulti", "copii-si-adolescenti", "familii", "seniori", "adictii", "formare-profesionala"] as const

const socialLinks = [
  { href: "https://www.facebook.com/eikonmindiasi/", label: "Facebook", glyph: "f" },
  { href: "https://www.instagram.com/eikon_mind/", label: "Instagram", glyph: "◎" },
  { href: "https://www.tiktok.com/@eikon.mind", label: "TikTok", glyph: "♪" },
] as const

export function PublicFooter({ locale }: { locale: Locale }) {
  const copy = site[locale].footer
  const nav = site[locale].nav
  const services = site[locale].home.services

  return <footer className="public-footer">
    <div className="public-footer__inner">
      <div className="public-footer__brand">
        <Image src="/assets/source/eikon-mind-logo.png" alt="Eikon Mind" width={553} height={500} sizes="180px" priority className="public-footer__logo" />
        <p>{copy.strapline}</p>
        <a href="mailto:contact@eikon-mind.ro">contact@eikon-mind.ro</a>
        <a href="tel:+40744897013">+40 744 897 013</a>
      </div>
      <div className="public-footer__column">
        <h2>{copy.explore}</h2>
        <Link href={`/${locale}`}>{nav.home}</Link>
        <Link href={`/${locale}/despre-mine`}>{nav.about}</Link>
        <Link href={`/${locale}/programare`}>{nav.scheduling}</Link>
        <Link href={`/${locale}/contact`}>{nav.contact}</Link>
        <Link href={`/${locale}/blog-page`}>Blog</Link>
      </div>
      <div className="public-footer__column">
        <h2>{nav.services}</h2>
        {serviceSlugs.map((slug) => <Link href={`/${locale}/${slug}`} key={slug}>{services.find((service) => service.slug === slug)?.title}</Link>)}
      </div>
      <div className="public-footer__column">
        <h2>{copy.legal}</h2>
        <Link href={`/${locale}/anpc-protectia-consumatorilor`}>ANPC</Link>
        <Link href={`/${locale}/politica-de-confidentialitate`}>{locale === "ro" ? "Confidențialitate" : "Privacy"}</Link>
        <Link href={`/${locale}/politica-de-cookies`}>Cookies</Link>
        <Link href={`/${locale}/termeni-si-conditii`}>{locale === "ro" ? "Termeni și condiții" : "Terms"}</Link>
        <h2 className="public-footer__social-title">{copy.follow}</h2>
        <div className="public-footer__socials">
          {socialLinks.map((social) => <a href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label} key={social.label}><span aria-hidden="true">{social.glyph}</span></a>)}
        </div>
      </div>
    </div>
    <div className="public-footer__bottom">
      <span>© {new Date().getFullYear()} Eikon Mind. {copy.copyright}</span>
      <Link href={`/${locale}`}>↑ {locale === "ro" ? "Înapoi sus" : "Back to top"}</Link>
    </div>
  </footer>
}

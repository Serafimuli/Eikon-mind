"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { SiteHeader } from "./SiteHeader"
import type { Locale } from "@/lib/site-content"

export function HomeHeader({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById("home-logo-threshold")
    if (!target) {
      setVisible(true)
      return
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(window.scrollY > 0)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting)
    }, { threshold: 0 })

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return <>
    <div className="home-brand">
      <Link href={`/${locale}`} aria-label="Eikon Mind">
        <Image src="/assets/source/eikon-mind-logo.png" alt="Eikon Mind" width={553} height={500} priority sizes="300px" className="home-brand__logo" />
      </Link>
      <span id="home-logo-threshold" className="home-brand__threshold" aria-hidden="true" />
    </div>
    <div className={`home-header-wrap${visible ? " shown" : ""}`} aria-hidden={!visible}>
      <SiteHeader locale={locale} />
    </div>
  </>
}

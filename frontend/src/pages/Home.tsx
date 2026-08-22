import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { SERVICE_CATALOG } from "@/data/mockData"
import { HOME_IMAGES } from "./Home.config"

export default function Home() {
  const { tr } = useApp()
  const { hero, intro, services, therapy, howItWorks, cta } = tr

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="site-container py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-5">
                {hero.badge}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-semibold text-foreground leading-tight mb-6 whitespace-pre-line">
                {hero.headline}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {hero.sub}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/client/book"
                  className="inline-flex items-center gap-2 button-primary"
                >
                  {hero.cta}
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 button-secondary"
                >
                  {hero.secondary}
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-72 h-80 sm:w-96 sm:h-[28rem] rounded-2xl overflow-hidden bg-muted shadow-lg">
                <img
                  src={HOME_IMAGES.hero}
                  alt={hero.imageAlt}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intro / About brief */}
      <section className="bg-card border-y border-border py-16 lg:py-20">
        <div className="site-container">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-5">
              {intro.tag}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-6 whitespace-pre-line">
              {intro.heading}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {intro.body}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {intro.link} <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 lg:py-24">
        <div className="site-container">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              {services.tag}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 whitespace-pre-line">
              {services.heading}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {services.sub}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {services.items.map((item, i) => (
              <div
                key={item.title}
                className="group surface-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="text-2xl mb-4">{item.icon}</div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {item.desc}
                </p>
                <Link
                  to={`/services#${SERVICE_CATALOG[i].id}`}
                  className="text-xs font-semibold text-primary group-hover:underline"
                >
                  {services.learnMore} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Types of therapy */}
      <section className="bg-card border-y border-border py-16 lg:py-24">
        <div className="site-container">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              {therapy.tag}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4 whitespace-pre-line">
              {therapy.heading}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {therapy.sub}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {therapy.items.map((item) => (
              <div
                key={item.name}
                className="bg-background border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-200"
              >
                <h3 className="font-display text-base font-semibold text-foreground mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {item.short}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {item.who}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/therapy"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {therapy.learnMore} →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-24">
        <div className="site-container">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              {howItWorks.tag}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground whitespace-pre-line">
              {howItWorks.heading}
            </h2>
          </div>
          <div className="how-it-works-grid grid sm:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {howItWorks.steps.map((step, i) => (
              <div
                key={step.num}
                className="flex flex-col items-center text-center relative"
              >
                {i < howItWorks.steps.length - 1 && (
                  <div className="how-it-works-connector hidden sm:block absolute top-6 h-px bg-border" />
                )}
                <div className="relative z-10 w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                  <span className="font-display text-sm font-bold text-primary">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-primary py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <img
            src={HOME_IMAGES.nature}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-primary-foreground mb-4 whitespace-pre-line">
            {cta.heading}
          </h2>
          <p className="text-base text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            {cta.sub}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/client/book"
              className="bg-primary-foreground text-primary px-7 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              {cta.primary}
            </Link>
            <Link
              to="/about"
              className="border border-primary-foreground/40 text-primary-foreground px-7 py-3 rounded-full text-sm font-medium hover:bg-primary-foreground/10 transition-colors"
            >
              {cta.secondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

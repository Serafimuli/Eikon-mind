import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ContentSection, HomeContent, Locale, PageContent } from "@/lib/site-content";

function ActionLink({
  locale,
  children,
  secondary = false,
}: {
  locale: Locale;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={secondary ? "button button--light" : "button"} href={`/${locale}/programare`}>
      {children}
    </Link>
  );
}

function Picture({
  src,
  alt,
  className = "",
  sizes = "(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return <Image className={className} src={src} alt={alt} fill sizes={sizes} priority={priority} />;
}

function SectionContent({ section }: { section: ContentSection }) {
  return (
    <section className="content-section">
      {section.title && <h2>{section.title}</h2>}
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.items && (
        <ul>
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {section.note && <p className="content-note">{section.note}</p>}
    </section>
  );
}

function PageHero({ page }: { page: PageContent }) {
  return (
    <section className={`inner-page-hero ${page.image ? "inner-page-hero--image" : ""}`}>
      <div className="inner-page-hero__copy">
        <p className="eyebrow">Eikon Mind</p>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
      </div>
      {page.image && (
        <div className="inner-page-hero__media">
          <Picture
            src={page.image}
            alt={page.imageAlt || page.title}
            sizes="(max-width: 720px) 100vw, 50vw"
          />
        </div>
      )}
    </section>
  );
}

function ServicePage({ locale, page }: { locale: Locale; page: PageContent }) {
  return (
    <div className="inner-page service-page">
      <PageHero page={page} />
      <div className="page-content service-page__content">
        <div className="service-page__intro">
          <p className="eyebrow">
            {locale === "ro" ? "Servicii psihologice" : "Psychological services"}
          </p>
          <p>{page.description}</p>
        </div>
        <div className="service-sections">
          {page.sections?.map((section) => (
            <SectionContent key={section.title} section={section} />
          ))}
        </div>
        {page.cta && (
          <div className="inline-cta">
            <h2>
              {locale === "ro"
                ? "Nu trebuie să treci singur prin asta."
                : "You do not have to go through this alone."}
            </h2>
            <ActionLink locale={locale}>{page.cta}</ActionLink>
          </div>
        )}
      </div>
    </div>
  );
}

function AboutPage({ locale, page }: { locale: Locale; page: PageContent }) {
  return (
    <div className="inner-page about-page">
      <PageHero page={page} />
      <div className="page-content">
        <div className="about-gallery">
          {page.gallery?.map((image, index) => (
            <div className={`about-gallery__item about-gallery__item--${index + 1}`} key={image}>
              <Picture
                src={image}
                alt={`${page.title} ${index + 1}`}
                sizes="(max-width: 720px) 50vw, 40vw"
              />
            </div>
          ))}
        </div>
        <div className="service-sections">
          {page.sections?.map((section) => (
            <SectionContent key={section.title} section={section} />
          ))}
        </div>
        {page.cta && (
          <div className="inline-cta">
            <h2>
              {locale === "ro"
                ? "Construim împreună următorul pas."
                : "Let’s build the next step together."}
            </h2>
            <ActionLink locale={locale}>{page.cta}</ActionLink>
          </div>
        )}
      </div>
    </div>
  );
}

function BookingPage({ locale, page }: { locale: Locale; page: PageContent }) {
  return (
    <div className="inner-page simple-page">
      <PageHero page={page} />
      <div className="page-content simple-page__content">
        {page.sections?.map((section) => (
          <SectionContent key={section.title} section={section} />
        ))}
        <div className="booking-card">
          <div>
            <p className="eyebrow">{locale === "ro" ? "Pasul următor" : "Next step"}</p>
            <h2>{page.cta}</h2>
            <p>
              {locale === "ro"
                ? "Intră în spațiul securizat al aplicației pentru a verifica disponibilitatea și a trimite cererea."
                : "Enter the secure app area to check availability and send your request."}
            </p>
          </div>
          <Link className="button" href={`/${locale}/client/book`}>
            {locale === "ro" ? "Continuă către programare" : "Continue to booking"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContactPage({ locale, page }: { locale: Locale; page: PageContent }) {
  const contact = page.contact;
  return (
    <div className="inner-page contact-page">
      <PageHero page={page} />
      <div className="page-content contact-layout">
        <div className="contact-details">
          <p className="eyebrow">
            {locale === "ro" ? "Discută direct cu mine" : "Talk to me directly"}
          </p>
          {contact && (
            <div className="contact-card">
              <div>
                <span>{locale === "ro" ? "Telefon" : "Phone"}</span>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
              </div>
              <div>
                <span>E-mail</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </div>
              <div>
                <span>{locale === "ro" ? "Locația" : "Location"}</span>
                <address>{contact.address}</address>
              </div>
              <div>
                <span>{locale === "ro" ? "Program" : "Opening hours"}</span>
                {contact.hours.map((hour) => (
                  <p key={hour}>{hour}</p>
                ))}
              </div>
            </div>
          )}
          <div className="contact-image">
            <Picture
              src="/assets/source/contacts-4.webp"
              alt={
                locale === "ro"
                  ? "Detaliu din cabinetul Eikon Mind"
                  : "Detail from the Eikon Mind office"
              }
              sizes="(max-width: 720px) 100vw, 40vw"
            />
          </div>
        </div>
        <div className="service-sections">
          {page.sections?.map((section) => (
            <SectionContent key={section.title} section={section} />
          ))}
          <div className="contact-actions">
            <ActionLink locale={locale}>{page.cta}</ActionLink>
            <a className="text-link" href={`mailto:${contact?.email}`}>
              {locale === "ro" ? "Trimite un e-mail" : "Send an email"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogPage({ locale, page }: { locale: Locale; page: PageContent }) {
  return (
    <div className="inner-page blog-page">
      <PageHero page={page} />
      <div className="page-content blog-page__content">
        <div className="blog-placeholder">
          <p className="eyebrow">{locale === "ro" ? "În curând" : "Coming soon"}</p>
          <h2>
            {locale === "ro"
              ? "Idei pentru o viață mai conștientă."
              : "Ideas for a more conscious life."}
          </h2>
          <p>{page.sections?.[0]?.paragraphs?.[0]}</p>
          <ActionLink locale={locale}>{page.cta}</ActionLink>
        </div>
      </div>
    </div>
  );
}

function LegalPage({ page }: { page: PageContent }) {
  return (
    <div className="inner-page legal-page">
      <PageHero page={page} />
      <article className="page-content legal-page__content">
        <div className="legal-document">
          {page.sections?.map((section) => (
            <SectionContent key={section.title} section={section} />
          ))}
          {page.table && (
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead>
                  <tr>
                    {page.table.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.table.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

export function PublicPageContent({ locale, page }: { locale: Locale; page: PageContent }) {
  if (page.kind === "service") return <ServicePage locale={locale} page={page} />;
  if (page.kind === "about") return <AboutPage locale={locale} page={page} />;
  if (page.kind === "booking") return <BookingPage locale={locale} page={page} />;
  if (page.kind === "contact") return <ContactPage locale={locale} page={page} />;
  if (page.kind === "blog") return <BlogPage locale={locale} page={page} />;
  return <LegalPage page={page} />;
}

function HomeHero({ locale, content }: { locale: Locale; content: HomeContent }) {
  return (
    <section className="home-hero">
      <div className="home-hero__copy">
        <p className="eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="home-hero__lead">{content.lead}</p>
        <ActionLink locale={locale}>{content.cta}</ActionLink>
      </div>
      <div className="home-hero__media">
        <Picture
          src="/assets/maria-manuela-nita.jpg"
          alt="Maria-Manuela Niță, psiholog și psihoterapeut"
          sizes="(max-width: 720px) 100vw, (max-width: 1100px) 45vw, 600px"
          priority
        />
      </div>
    </section>
  );
}

export function HomePageContent({ locale, content }: { locale: Locale; content: HomeContent }) {
  return (
    <div className="home-page">
      <HomeHero locale={locale} content={content} />
      <section className="source-section intro-section">
        <div className="section-heading">
          <p className="eyebrow">Eikon Mind</p>
          <h2>{content.introTitle}</h2>
        </div>
        <div className="intro-section__body">
          <p>{content.intro}</p>
          <p className="display-quote">{content.quote}</p>
        </div>
      </section>
      <section className="quote-band">
        <p>{content.servicesQuote}</p>
      </section>
      <section className="source-section services-section">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">{content.servicesTitle}</p>
          <h2>{content.servicesLead}</h2>
        </div>
        <div className="services-grid">
          {content.services.map((service) => (
            <Link className="service-card" href={`/${locale}/${service.slug}`} key={service.slug}>
              <div className="service-card__image">
                <Picture src={service.image} alt={service.imageAlt} />
              </div>
              <div className="service-card__body">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <span className="arrow-link">
                  {locale === "ro" ? "Descoperă serviciul" : "Discover the service"}{" "}
                  <span aria-hidden>↗</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="about-panel">
        <div className="about-panel__image">
          <Picture
            src="/assets/despre-mine-eikon-mind.jpg"
            alt="Maria-Manuela Niță în natură"
            sizes="(max-width: 720px) 100vw, 45vw"
          />
        </div>
        <div className="about-panel__copy">
          <p className="eyebrow">{content.aboutTitle}</p>
          <h2>{content.aboutName}</h2>
          <p className="about-role">{content.aboutRole}</p>
          <p>{content.aboutText}</p>
          <ul>
            {content.aboutItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className="text-link" href={`/${locale}/despre-mine`}>
            {locale === "ro" ? "Citește mai mult despre mine" : "Read more about me"}{" "}
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </section>
      <section className="marquee-band">
        <p>{content.marquee}</p>
      </section>
      <section className="source-section feature-section">
        <div className="feature-panel">
          <div className="feature-panel__copy">
            <p className="eyebrow">Eikon Mind Iași</p>
            <h2>{content.featureTitle}</h2>
            <p>{content.featureText}</p>
            <ActionLink locale={locale}>{content.cta}</ActionLink>
          </div>
          <div className="feature-panel__image">
            <Picture
              src="/assets/office.jpg"
              alt="Spațiu luminos de psihoterapie Eikon Mind"
              sizes="(max-width: 720px) 100vw, 45vw"
            />
          </div>
        </div>
      </section>
      <section className="source-section benefits-section">
        <div className="section-heading">
          <p className="eyebrow">{content.benefitsEyebrow}</p>
          <h2>{content.benefitsTitle}</h2>
          <Link className="text-link" href={`/${locale}/adulti`}>
            {content.benefitsLink} <span aria-hidden>↗</span>
          </Link>
        </div>
        <div className="benefits-gallery">
          <div className="benefits-gallery__large">
            <Picture
              src="/assets/source/cabinet-psiholog.jpg"
              alt="Cabinet de psihoterapie Eikon Mind"
              sizes="(max-width: 720px) 100vw, 40vw"
            />
          </div>
          <div className="benefits-gallery__small">
            <Picture
              src="/assets/eikon-mind-iasi-full.jpg"
              alt="Detaliu din locația Eikon Mind Iași"
              sizes="(max-width: 720px) 100vw, 28vw"
            />
          </div>
          <ul>
            {content.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="recommendation">
        <div className="recommendation__mark">“</div>
        <p>{content.recommendation.quote}</p>
        <strong>{content.recommendation.author}</strong>
        <a href={content.recommendation.link} target="_blank" rel="noreferrer">
          {locale === "ro" ? "Vezi recomandarea" : "View recommendation"} ↗
        </a>
      </section>
      <section className="source-section testimonials-section">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">{locale === "ro" ? "Testimoniale" : "Testimonials"}</p>
          <h2>{content.testimonialsTitle}</h2>
        </div>
        <div className="testimonial-grid">
          {content.testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.author}>
              <div className="testimonial-card__image">
                <Picture
                  src={testimonial.image}
                  alt={`Testimonial ${testimonial.author}`}
                  sizes="72px"
                />
              </div>
              <div className="testimonial-card__body">
                <p>“{testimonial.quote}”</p>
                <strong>{testimonial.author}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="source-section sessions-section">
        <div className="section-heading">
          <p className="eyebrow">{locale === "ro" ? "Ședințe" : "Sessions"}</p>
          <h2>{content.sessionsTitle}</h2>
        </div>
        <div className="session-grid">
          {content.sessions.map((session) => (
            <article className="session-card" key={session.title}>
              <h3>{session.title}</h3>
              <p>{session.body}</p>
              <ul>
                {session.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span className="session-duration">{session.duration}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="blog-strip">
        <div>
          <p className="eyebrow">{content.blogTitle}</p>
          <h2>{content.blogText}</h2>
        </div>
        <Link className="button" href={`/${locale}/blog-page`}>
          {content.blogLink} <span aria-hidden>↗</span>
        </Link>
      </section>
      <section className="final-cta">
        <p className="eyebrow">Eikon Mind</p>
        <h2>{content.finalCta}</h2>
        <ActionLink locale={locale} secondary>
          {content.finalCtaButton}
        </ActionLink>
      </section>
    </div>
  );
}

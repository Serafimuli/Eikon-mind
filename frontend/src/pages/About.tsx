import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import { ABOUT_IMAGES } from "./About.config"

const credentials = {
  en: {
    education: [
      {
        title: "Clinical Psychologist",
        org: "Cognitive-Behavioural Psychotherapist",
        year: "—",
      },
      { title: "Addiction Counsellor", org: "Trainer", year: "—" },
    ],
    qualifications: [
      "Clarity — deep understanding is the foundation of lasting change.",
      "Rigour — interventions are guided by scientific evidence and professional responsibility.",
      "Safety — confidentiality, respect, and acceptance ground the therapeutic relationship.",
      "Collaboration — therapy is a partnership built on trust and shared objectives.",
      "Authenticity — profound change reflects personal values rather than outside expectations.",
      "Evolution — development is a continuous process of learning, adaptation, and growth.",
    ],
    experience: [
      {
        role: "Health, education, social services, and human development",
        org: "Professional journey",
        period: "—",
      },
      {
        role: "Children, adolescents, adults, families, and professionals",
        org: "People supported",
        period: "—",
      },
      {
        role: "Social vulnerability, illness, loss, trauma, and palliative care",
        org: "Contexts of work",
        period: "—",
      },
      {
        role: "Burnout prevention, addiction recovery, and professional development",
        org: "Areas of practice",
        period: "—",
      },
    ],
    expertise: [
      "Evidence-based psychotherapy",
      "Clinical assessment and psychodiagnosis",
      "Addiction counselling",
      "Children and adolescents",
      "Families",
      "Seniors",
      "Burnout prevention",
      "Professional development",
    ],
  },
  ro: {
    education: [
      {
        title: "Psiholog clinician",
        org: "Psihoterapeut cognitiv-comportamental",
        year: "—",
      },
      {
        title: "Consilier în adicții",
        org: "Formator",
        year: "—",
      },
    ],
    qualifications: [
      "Claritate — Înțelegerea profundă reprezintă fundamentul oricărei schimbări durabile.",
      "Rigoare — intervențiile sunt ghidate de dovezi științifice și responsabilitate profesională.",
      "Siguranță — confidențialitatea, respectul și acceptarea constituie baza relației terapeutice.",
      "Colaborare — procesul terapeutic este un parteneriat construit pe încredere și obiective comune.",
      "Autenticitate — schimbarea profundă reflectă valorile personale, nu așteptările exterioare.",
      "Evoluție — dezvoltarea este un proces continuu de învățare, adaptare și creștere.",
    ],
    experience: [
      {
        role: "Sănătate, educație, servicii sociale și dezvoltare umană",
        org: "Parcurs profesional",
        period: "—",
      },
      {
        role: "Copii, adolescenți, adulți, familii și profesioniști",
        org: "Persoane sprijinite",
        period: "—",
      },
      {
        role: "Vulnerabilitate socială, boală, pierdere, traumă și îngrijiri paliative",
        org: "Contexte de lucru",
        period: "—",
      },
      {
        role: "Prevenirea burnoutului, recuperarea în adicții și dezvoltare profesională",
        org: "Arii de practică",
        period: "—",
      },
    ],
    expertise: [
      "Psihoterapie bazată pe dovezi științifice",
      "Evaluare clinică și psihodiagnostic",
      "Consiliere în adicții",
      "Copii și adolescenți",
      "Familii",
      "Seniori",
      "Prevenirea burnoutului",
      "Dezvoltare profesională",
    ],
  },
}

export default function About() {
  const { tr, lang } = useApp()
  const a = tr.about
  const c = credentials[lang]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <section className="public-page-header">
        <div className="site-container">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            {a.title}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground">
            {a.name}
          </h1>
          <p className="text-base text-muted-foreground mt-2">{a.credential}</p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 lg:py-24">
        <div className="site-container">
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Portrait col */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-6">
                  <img
                    src={ABOUT_IMAGES.portrait}
                    alt={a.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Link
                  to="/client/book"
                  className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {tr.cta.primary}
                </Link>
              </div>
            </div>

            {/* Content col */}
            <div className="lg:col-span-2 space-y-10">
              <div>
                <p className="text-lg text-foreground font-medium leading-relaxed mb-4">
                  {a.intro}
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {a.bio}
                </p>
              </div>

              {/* Philosophy */}
              <div className="surface-card p-6 lg:p-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  {a.philosophy}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {a.philosophyText}
                </p>
              </div>

              {/* Education */}
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-5">
                  {a.education}
                </h2>
                <div className="flex flex-col gap-4">
                  {c.education.map((e) => (
                    <div key={e.title} className="flex items-start gap-4">
                      <span className="text-xs font-mono text-muted-foreground mt-1 w-10 shrink-0">
                        {e.year}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {e.title}
                        </p>
                        <p className="text-sm text-muted-foreground">{e.org}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualifications */}
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-5">
                  {a.qualifications}
                </h2>
                <ul className="flex flex-col gap-2.5">
                  {c.qualifications.map((q) => (
                    <li
                      key={q}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="text-primary mt-1 shrink-0">
                        ✓
                      </span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Experience */}
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-5">
                  {a.experience}
                </h2>
                <div className="flex flex-col gap-4">
                  {c.experience.map((e) => (
                    <div key={e.role} className="flex items-start gap-4">
                      <span className="text-xs font-mono text-muted-foreground mt-1 shrink-0">
                        {e.period}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {e.role}
                        </p>
                        <p className="text-sm text-muted-foreground">{e.org}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expertise */}
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-5">
                  {a.expertise}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {c.expertise.map((e) => (
                    <span
                      key={e}
                      className="px-3 py-1 bg-muted rounded-full text-sm text-foreground"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

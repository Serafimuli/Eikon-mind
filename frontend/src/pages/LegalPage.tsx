import type { ReactNode } from "react"
import { Link } from "react-router"
import { useApp } from "@/contexts/AppContext"
import type { Lang } from "@/i18n/translations"

export type LegalDocumentKind = "privacy" | "terms"

type LegalSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  closing?: ReactNode
}

type LegalDocument = {
  title: string
  updated: string
  introduction: string[]
  sections: LegalSection[]
  closing?: ReactNode
}

const LEGAL_CONTENT: Record<Lang, Record<LegalDocumentKind, LegalDocument>> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: 22 June 2026",
      introduction: [
        "Eikon Mind – Psychology Practice respects your privacy and is committed to protecting personal data in accordance with Regulation (EU) 2016/679 on the protection of individuals with regard to the processing of personal data and the free movement of such data (GDPR), as well as applicable national legislation.",
      ],
      sections: [
        {
          heading: "1. Data controller",
          paragraphs: [
            "Maria-Manuela Niță — clinical psychologist, cognitive-behavioural psychotherapist, addiction counsellor, and trainer; Individual Psychology Practice Eikon Mind. Address: Strada Vasile Lupu nr. 35A, ap. 34, Iași, Romania, postal code 700319. Phone: 0744 897 013. Email: contact@eikon-mind.ro. Website: https://eikon-mind.ro/.",
          ],
        },
        {
          heading: "2. Data we process",
          paragraphs: [
            "We collect and process the following categories of data:",
          ],
          bullets: [
            "Identification and contact data: first name, last name, email address, telephone number, and postal address.",
            "Appointment and service data: appointment date and time, reason for the request, and session history.",
            "Special categories of data, including health data: mental-health information, symptoms, medical or psychological history, session notes, diagnoses, and therapeutic recommendations required to provide psychology, psychotherapy, and counselling services.",
            "Technical data: IP address, browser type, and cookie data, as described in the cookie policy.",
            "Payment data, where applicable: transaction information without storing complete card details.",
          ],
        },
        {
          heading: "3. Purposes and legal grounds",
          paragraphs: ["We process your data for the following purposes:"],
          bullets: [
            "Providing psychology and psychotherapy services, based on contract performance and explicit consent for special health data under Article 6(1)(b) and Article 9(2)(a) GDPR.",
            "Appointments and communication, based on consent or legitimate interest.",
            "Issuing fiscal documents, based on a legal obligation.",
            "Improving services and producing internal statistics, based on legitimate interest.",
            "Complying with legal obligations, including accounting records and responses to public authorities.",
          ],
        },
        {
          heading: "4. Recipients of data",
          paragraphs: ["Your data may be disclosed only to:"],
          bullets: [
            "Authorised collaborators, such as an accountant or lawyer, who respect confidentiality.",
            "Competent authorities when required by law, such as courts or investigative bodies.",
            "We never disclose data to marketing third parties without explicit consent and do not transfer data outside the European Union.",
          ],
        },
        {
          heading: "5. Retention period",
          bullets: [
            "Contact and appointment data are retained for the duration of the contractual relationship plus three years after its end, reflecting the general limitation period.",
            "Clinical notes and health data are retained according to professional and legal obligations, for a minimum of ten years under applicable COPSI rules and legislation.",
            "Cookie data are retained as described in the cookie policy.",
            "When the retention period expires, data are securely deleted or anonymised.",
          ],
        },
        {
          heading: "6. Your GDPR rights",
          paragraphs: ["You have the right to:"],
          bullets: [
            "Access the data we process.",
            "Rectify inaccurate data.",
            "Request deletion, subject to legal retention obligations.",
            "Restrict processing.",
            "Object to processing, including for marketing.",
            "Data portability.",
            "Withdraw consent at any time without affecting the lawfulness of prior processing.",
            "Lodge a complaint with the National Supervisory Authority for Personal Data Processing (ANSPDCP) at www.dataprotection.ro.",
          ],
          closing: (
            <p>
              To exercise your rights, contact us at{" "}
              <a
                href="mailto:contact@eikon-mind.ro"
                className="text-primary hover:underline"
              >
                contact@eikon-mind.ro
              </a>
              .
            </p>
          ),
        },
        {
          heading: "7. Security measures",
          paragraphs: [
            "We implement appropriate technical and organisational measures, including HTTPS encryption, restricted access, secure backups, and staff training, to protect data against unauthorised access, loss, or destruction.",
          ],
        },
        {
          heading: "8. Cookies and similar technologies",
          paragraphs: [
            "The website uses essential cookies required for correct operation and optional analytics cookies. Further details are provided in the cookie policy.",
          ],
        },
        {
          heading: "9. Policy updates",
          paragraphs: [
            "This policy may be updated periodically. Important changes will be communicated through the website or by email.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "For questions about this Privacy Policy or the processing of your data, please contact us:",
          ],
          bullets: [
            "Email: contact@eikon-mind.ro",
            "Phone: 0744 897 013",
            "Address: Strada Vasile Lupu nr. 35A, ap. 34, Iași, Romania, 700319",
          ],
        },
      ],
      closing: (
        <p>
          By using https://eikon-mind.ro/ and our services, you confirm that
          you have read, understood, and agree to this Privacy Policy.
        </p>
      ),
    },
    terms: {
      title: "Terms of Service",
      updated: "Last updated: 22 June 2026",
      introduction: [
        "Welcome to https://eikon-mind.ro/, the official website of the Individual Psychology Practice Eikon Mind.",
        "By accessing and using this website, you agree to these Terms of Service. Please read them carefully before using our services.",
      ],
      sections: [
        {
          heading: "1. Operator information",
          paragraphs: [
            "Maria-Manuela Niță — clinical psychologist, cognitive-behavioural psychotherapist, addiction counsellor, and trainer; Individual Psychology Practice Eikon Mind. Address: Strada Vasile Lupu nr. 35A, ap. 34, Iași, Romania, postal code 700319. Phone: 0744 897 013. Email: contact@eikon-mind.ro.",
          ],
        },
        {
          heading: "2. Services offered",
          paragraphs: ["The website provides information about:"],
          bullets: [
            "Clinical psychology.",
            "Cognitive-behavioural psychotherapy.",
            "Addiction counselling.",
            "Training and related services.",
            "Appointments and the actual delivery of services take place exclusively through direct contact by telephone, email, or at the practice.",
          ],
        },
        {
          heading: "3. Appointments and contracts",
          bullets: [
            "Appointments may be made by telephone, email, or the website form.",
            "A confirmed appointment represents acceptance of the service conditions.",
            "Fees are displayed on the website or communicated when the appointment is made and are paid according to the agreed method, such as cash or bank transfer.",
            "Cancellation or rescheduling must take place at least 24 hours in advance. Otherwise, a late-cancellation fee of 50% of the session value may apply.",
          ],
        },
        {
          heading: "4. Beneficiary rights and obligations",
          paragraphs: [
            "You are entitled to services provided professionally and confidentially, in accordance with the Deontological Code of the psychology profession and the College of Psychologists of Romania.",
          ],
          bullets: [
            "Provide accurate and complete information when making an appointment.",
            "Respect appointment times.",
            "Pay the agreed fees on time.",
          ],
        },
        {
          heading: "5. Confidentiality and data protection",
          paragraphs: [
            "All personal data and information concerning health are protected under the Privacy Policy and GDPR legislation. Professional secrecy in psychological services is guaranteed by law.",
          ],
        },
        {
          heading: "6. Limitations of liability",
          bullets: [
            "The information on this website is for informational purposes and does not replace a professional assessment or therapy.",
            "We do not guarantee specific results; therapy outcomes depend on many factors, including the beneficiary's involvement.",
            "The practice is not responsible for damage resulting from incorrect use of information on the website.",
          ],
        },
        {
          heading: "7. Consumer withdrawal right",
          paragraphs: [
            "Under consumer-protection legislation, you have a 14-day withdrawal right from the conclusion of a distance contract, except for services that have already begun with your express agreement, such as completed therapy sessions.",
          ],
        },
        {
          heading: "8. Intellectual property",
          paragraphs: [
            "All website content, including text, images, and the logo, belongs to Eikon Mind or its licensors. Copying, distributing, or commercially using this content without written permission is prohibited.",
          ],
        },
        {
          heading: "9. Dispute resolution",
          bullets: [
            "Any dispute will first be resolved amicably.",
            "If an agreement cannot be reached, Romanian law applies.",
            "You may use the Alternative Dispute Resolution platform through ANPC.",
          ],
        },
        {
          heading: "10. Changes to the terms",
          paragraphs: [
            "We reserve the right to update these Terms of Service. Changes will be published on the website. Continued use of the website after an update constitutes acceptance of the new terms.",
          ],
        },
        {
          heading: "11. Contact",
          paragraphs: [
            "For questions about these Terms of Service, please contact us:",
          ],
          bullets: [
            "Email: contact@eikon-mind.ro",
            "Phone: 0744 897 013",
            "Address: Strada Vasile Lupu nr. 35A, ap. 34, Iași, Romania, 700319",
          ],
        },
      ],
    },
  },
  ro: {
    privacy: {
      title: "Politică de confidențialitate",
      updated: "Ultima actualizare: 22 iunie 2026",
      introduction: [
        "Eikon Mind – Cabinet de Psihologie respectă confidențialitatea dumneavoastră și se angajează să protejeze datele cu caracter personal în conformitate cu Regulamentul (UE) 2016/679 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și libera circulație a acestor date (GDPR), precum și cu legislația națională aplicabilă.",
      ],
      sections: [
        {
          heading: "1. Operatorul de date",
          paragraphs: [
            "Maria-Manuela Niță — psiholog clinician, psihoterapeut cognitiv-comportamental, consilier în adicții și formator; Cabinet Individual de Psihologie Eikon Mind. Adresă: Strada Vasile Lupu nr. 35A, ap. 34, Iași, România, cod poștal 700319. Telefon: 0744 897 013. Email: contact@eikon-mind.ro. Site web: https://eikon-mind.ro/.",
          ],
        },
        {
          heading: "2. Datele pe care le prelucrăm",
          paragraphs: [
            "Colectăm și prelucrăm următoarele categorii de date:",
          ],
          bullets: [
            "Date de identificare și contact: nume, prenume, adresă de email, număr de telefon și adresă poștală.",
            "Date despre programări și servicii: data și ora programării, motivul solicitării și istoricul sesiunilor.",
            "Date speciale, inclusiv date privind sănătatea: informații despre starea de sănătate mentală, simptome, istoric medical sau psihologic, note de ședință, diagnostice și recomandări terapeutice necesare pentru prestarea serviciilor de psihologie, psihoterapie și consiliere.",
            "Date tehnice: adresa IP, tipul browserului și date despre cookies, conform politicii de cookies.",
            "Date de plată, dacă este cazul: informații despre tranzacții, fără stocarea detaliilor complete ale cardului.",
          ],
        },
        {
          heading: "3. Scopurile prelucrării și temeiul legal",
          paragraphs: ["Prelucrăm datele dumneavoastră pentru:"],
          bullets: [
            "Prestarea serviciilor de psihologie și psihoterapie, în temeiul executării contractului și al consimțământului explicit pentru date speciale privind sănătatea, conform Art. 6(1)(b) și Art. 9(2)(a) GDPR.",
            "Programări și comunicare, în temeiul consimțământului sau al interesului legitim.",
            "Emiterea documentelor fiscale, în temeiul obligației legale.",
            "Îmbunătățirea serviciilor și statistici interne, în temeiul interesului legitim.",
            "Respectarea obligațiilor legale, inclusiv evidențe contabile și răspunsuri către autorități.",
          ],
        },
        {
          heading: "4. Destinatarii datelor",
          paragraphs: ["Datele dumneavoastră pot fi divulgate doar:"],
          bullets: [
            "Colaboratorilor autorizați, precum contabilul sau avocatul, care respectă confidențialitatea.",
            "Autorităților competente, atunci când legea o impune, precum instanțe sau organe de anchetă.",
            "Niciodată unor terți de marketing fără consimțământul explicit. Nu transferăm date în afara Uniunii Europene.",
          ],
        },
        {
          heading: "5. Durata stocării",
          bullets: [
            "Datele de contact și programări sunt păstrate pe durata relației contractuale și încă trei ani după încheierea acesteia, conform termenului general de prescripție.",
            "Notele clinice și datele de sănătate sunt păstrate conform obligațiilor profesionale și legale, minimum 10 ani, conform normelor COPSI și legislației aplicabile.",
            "Datele din cookies sunt păstrate conform politicii de cookies.",
            "La expirarea perioadei, datele sunt șterse sau anonimizate în siguranță.",
          ],
        },
        {
          heading: "6. Drepturile dumneavoastră conform GDPR",
          paragraphs: ["Aveți dreptul să:"],
          bullets: [
            "Accesați datele prelucrate.",
            "Rectificați datele inexacte.",
            "Solicitați ștergerea datelor, cu excepția cazurilor în care legea ne obligă să le păstrăm.",
            "Restricționați prelucrarea.",
            "Vă opuneți prelucrării, inclusiv pentru marketing.",
            "Solicitați portabilitatea datelor.",
            "Retrageți consimțământul oricând, fără a afecta legalitatea prelucrării anterioare.",
            "Depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), la www.dataprotection.ro.",
          ],
          closing: (
            <p>
              Pentru exercitarea drepturilor, contactați-ne la{" "}
              <a
                href="mailto:contact@eikon-mind.ro"
                className="text-primary hover:underline"
              >
                contact@eikon-mind.ro
              </a>
              .
            </p>
          ),
        },
        {
          heading: "7. Măsuri de securitate",
          paragraphs: [
            "Implementăm măsuri tehnice și organizatorice adecvate, inclusiv criptare HTTPS, acces restricționat, backup-uri securizate și instruirea personalului, pentru a proteja datele împotriva accesului neautorizat, pierderii sau distrugerii.",
          ],
        },
        {
          heading: "8. Cookies și tehnologii similare",
          paragraphs: [
            "Site-ul utilizează cookies esențiale pentru funcționarea corectă și cookies opționale pentru analiză. Detalii suplimentare sunt oferite în politica de cookies.",
          ],
        },
        {
          heading: "9. Actualizări ale politicii",
          paragraphs: [
            "Această politică poate fi actualizată periodic. Modificările importante vor fi comunicate prin site sau email.",
          ],
        },
        {
          heading: "10. Contact",
          paragraphs: [
            "Pentru orice întrebări privind această Politică de confidențialitate sau prelucrarea datelor dumneavoastră, vă rugăm să ne contactați:",
          ],
          bullets: [
            "Email: contact@eikon-mind.ro",
            "Telefon: 0744 897 013",
            "Adresă: Strada Vasile Lupu nr. 35A, ap. 34, Iași, România, 700319",
          ],
        },
      ],
      closing: (
        <p>
          Prin utilizarea site-ului https://eikon-mind.ro/ și a serviciilor
          noastre, confirmați că ați citit, înțeles și sunteți de acord cu
          această Politică de confidențialitate.
        </p>
      ),
    },
    terms: {
      title: "Termeni și condiții",
      updated: "Ultima actualizare: 22 iunie 2026",
      introduction: [
        "Bine ați venit pe https://eikon-mind.ro/, site-ul oficial al Cabinetului Individual de Psihologie Eikon Mind.",
        "Prin accesarea și utilizarea acestui site, sunteți de acord cu acești Termeni și condiții. Vă rugăm să îi citiți cu atenție înainte de a utiliza serviciile noastre.",
      ],
      sections: [
        {
          heading: "1. Informații despre operator",
          paragraphs: [
            "Maria-Manuela Niță — psiholog clinician, psihoterapeut cognitiv-comportamental, consilier în adicții și formator; Cabinet Individual de Psihologie Eikon Mind. Adresă: Strada Vasile Lupu nr. 35A, ap. 34, Iași, România, cod poștal 700319. Telefon: 0744 897 013. Email: contact@eikon-mind.ro.",
          ],
        },
        {
          heading: "2. Serviciile oferite",
          paragraphs: ["Site-ul oferă informații despre serviciile de:"],
          bullets: [
            "Psihologie clinică.",
            "Psihoterapie cognitiv-comportamentală.",
            "Consiliere în adicții.",
            "Formare și alte servicii conexe.",
            "Programările și prestarea efectivă a serviciilor se realizează exclusiv prin contact direct, telefon, email sau la cabinet.",
          ],
        },
        {
          heading: "3. Programări și contracte",
          bullets: [
            "Programările se fac prin telefon, email sau formularul de pe site.",
            "O programare confirmată reprezintă acceptarea condițiilor de prestare a serviciilor.",
            "Onorariile sunt afișate pe site sau comunicate la programare și se achită conform înțelegerii, precum numerar sau transfer bancar.",
            "Anularea sau reprogramarea unei ședințe se face cu minimum 24 de ore înainte. În caz contrar, se poate aplica o taxă de anulare tardivă de 50% din valoarea ședinței.",
          ],
        },
        {
          heading: "4. Drepturi și obligații ale beneficiarilor",
          paragraphs: [
            "Beneficiați de servicii prestate cu profesionalism, confidențialitate și respectarea Codului Deontologic al profesiei de psiholog și al Colegiului Psihologilor din România.",
          ],
          bullets: [
            "Furnizați informații corecte și complete la programare.",
            "Respectați orele de programare.",
            "Plătiți la timp onorariile convenite.",
          ],
        },
        {
          heading: "5. Confidențialitate și protecția datelor",
          paragraphs: [
            "Toate datele personale și informațiile legate de starea de sănătate sunt protejate conform Politicii de confidențialitate și legislației GDPR. Secretul profesional al actului psihologic este garantat prin lege.",
          ],
        },
        {
          heading: "6. Limitări de răspundere",
          bullets: [
            "Informațiile de pe site au scop informativ și nu înlocuiesc o evaluare sau terapie profesională.",
            "Nu garantăm rezultate specifice — succesul terapiei depinde de mulți factori, inclusiv implicarea beneficiarului.",
            "Cabinetul nu este responsabil pentru daune rezultate din utilizarea incorectă a informațiilor de pe site.",
          ],
        },
        {
          heading: "7. Dreptul de retragere pentru consumatori",
          paragraphs: [
            "Conform legislației privind protecția consumatorilor, aveți dreptul de retragere în 14 zile de la încheierea contractului la distanță, cu excepția serviciilor care au început deja cu acordul dumneavoastră expres, precum ședințele de terapie efectuate.",
          ],
        },
        {
          heading: "8. Proprietate intelectuală",
          paragraphs: [
            "Toate conținuturile site-ului, inclusiv textele, imaginile și logo-ul, sunt proprietatea Cabinetului Eikon Mind sau a licențiatorilor săi. Este interzisă copierea, distribuirea sau utilizarea comercială fără acord scris.",
          ],
        },
        {
          heading: "9. Soluționarea litigiilor",
          bullets: [
            "Orice dispută va fi soluționată amiabil.",
            "În caz de neînțelegere, se aplică legislația română.",
            "Puteți utiliza platforma de Soluționare Alternativă a Litigiilor (SAL) prin ANPC.",
          ],
        },
        {
          heading: "10. Modificări ale termenilor",
          paragraphs: [
            "Ne rezervăm dreptul de a actualiza acești Termeni și condiții. Modificările vor fi publicate pe site. Continuarea utilizării site-ului după actualizare implică acceptarea noilor termeni.",
          ],
        },
        {
          heading: "11. Contact",
          paragraphs: [
            "Pentru orice întrebări legate de acești Termeni și condiții, vă rugăm să ne contactați:",
          ],
          bullets: [
            "Email: contact@eikon-mind.ro",
            "Telefon: 0744 897 013",
            "Adresă: Strada Vasile Lupu nr. 35A, ap. 34, Iași, România, 700319",
          ],
        },
      ],
    },
  },
}

function LegalSection({ section }: { section: LegalSection }) {
  return (
    <section className="border-t border-border pt-6 mt-8 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-3">
        {section.heading}
      </h2>
      {section.paragraphs?.map((paragraph) => (
        <p
          key={paragraph}
          className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 last:mb-0"
        >
          {paragraph}
        </p>
      ))}
      {section.bullets && (
        <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
      {section.closing && (
        <div className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3">
          {section.closing}
        </div>
      )}
    </section>
  )
}

export default function LegalPage({ kind }: { kind: LegalDocumentKind }) {
  const { lang } = useApp()
  const document = LEGAL_CONTENT[lang][kind]

  return (
    <div className="animate-fade-in">
      <section className="public-page-header">
        <div className="site-container">
          <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Eikon Mind
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground">
            {document.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-4">
            {document.updated}
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-20">
        <div className="site-container">
          <article className="surface-card max-w-4xl mx-auto p-6 sm:p-8 lg:p-10">
            {document.introduction.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 last:mb-0"
              >
                {paragraph}
              </p>
            ))}
            <div className="mt-8">
              {document.sections.map((section) => (
                <LegalSection key={section.heading} section={section} />
              ))}
            </div>
            {document.closing && (
              <div className="border-t border-border pt-6 mt-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
                {document.closing}
              </div>
            )}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-border">
              <Link
                to={kind === "privacy" ? "/terms" : "/privacy"}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {kind === "privacy"
                  ? lang === "ro"
                    ? "Vezi termenii și condițiile"
                    : "View Terms of Service"
                  : lang === "ro"
                    ? "Vezi politica de confidențialitate"
                    : "View Privacy Policy"}
              </Link>
              <Link
                to="/"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {lang === "ro" ? "Înapoi la pagina principală" : "Back to Home"}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

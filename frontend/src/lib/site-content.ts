export const locales = ["ro", "en"] as const
export type Locale = (typeof locales)[number]

export const publicSlugs = [
  "adulti",
  "copii-si-adolescenti",
  "familii",
  "seniori",
  "adictii",
  "formare-profesionala",
  "despre-mine",
  "programare",
  "contact",
  "blog-page",
  "anpc-protectia-consumatorilor",
  "politica-de-confidentialitate",
  "politica-de-cookies",
  "termeni-si-conditii",
] as const
export type PublicSlug = (typeof publicSlugs)[number]

export type ContentSection = {
  title?: string
  paragraphs?: string[]
  items?: string[]
  note?: string
}

export type TableContent = {
  headers: string[]
  rows: string[][]
}

export type PageContent = {
  kind: "service" | "about" | "booking" | "contact" | "blog" | "legal"
  title: string
  description: string
  image?: string
  imageAlt?: string
  sections?: ContentSection[]
  gallery?: string[]
  cta?: string
  contact?: {
    phone: string
    email: string
    address: string
    hours: string[]
  }
  table?: TableContent
}

export type ServiceSummary = {
  slug: Extract<PublicSlug, "adulti" | "copii-si-adolescenti" | "familii" | "seniori" | "adictii" | "formare-profesionala">
  title: string
  description: string
  image: string
  imageAlt: string
}

export type HomeContent = {
  eyebrow: string
  title: string
  lead: string
  cta: string
  introTitle: string
  intro: string
  quote: string
  servicesTitle: string
  servicesLead: string
  servicesQuote: string
  services: ServiceSummary[]
  aboutTitle: string
  aboutRole: string
  aboutName: string
  aboutText: string
  aboutItems: string[]
  marquee: string
  featureTitle: string
  featureText: string
  benefitsEyebrow: string
  benefitsTitle: string
  benefitsLink: string
  benefits: string[]
  recommendation: { quote: string; author: string; link: string }
  testimonialsTitle: string
  testimonials: { quote: string; author: string; image: string }[]
  sessionsTitle: string
  sessions: { title: string; body: string; items: string[]; duration: string }[]
  blogTitle: string
  blogText: string
  blogLink: string
  finalCta: string
  finalCtaButton: string
}

export type LocaleSite = {
  nav: {
    home: string
    services: string
    about: string
    scheduling: string
    contact: string
    login: string
    account: string
  }
  footer: {
    strapline: string
    explore: string
    legal: string
    follow: string
    copyright: string
  }
  home: HomeContent
  pages: Record<PublicSlug, PageContent>
}

const assets = {
  logo: "/assets/source/eikon-mind-logo.png",
  portrait: "/assets/maria-manuela-nita.jpg",
  about: "/assets/despre-mine-eikon-mind.jpg",
  office: "/assets/office.jpg",
  seniors: "/assets/service-seniors.jpg",
  cabinet: "/assets/source/cabinet-psychologic.jpg",
  iasi: "/assets/eikon-mind-iasi-full.jpg",
  psychologist: "/assets/source/cabinet-psiholog.jpg",
  imageOne: "/assets/image-1-full.jpg",
  sunset: "/assets/source/apus-de-soare.jpg",
  contact: "/assets/source/contact-background.jpg",
  contactDetail: "/assets/source/contacts-4.webp",
  footer: "/assets/source/footer-background.webp",
  adults: "/assets/service-adults.jpg",
  children: "/assets/service-children-adolescents.jpg",
  families: "/assets/service-families.jpg",
  seniorService: "/assets/service-seniors.jpg",
  addictions: "/assets/service-addictions.jpg",
  training: "/assets/service-professional-formation.jpg",
  testimonials: [
    "/assets/source/testimonial-1.webp",
    "/assets/source/testimonial-2.webp",
    "/assets/source/testimonial-3.webp",
    "/assets/source/testimonial-4.webp",
    "/assets/source/testimonial-5.webp",
  ],
}

const roServices: ServiceSummary[] = [
  { slug: "adulti", title: "Adulți", description: "Un spațiu pentru claritate, echilibru emoțional și schimbare autentică.", image: assets.adults, imageAlt: "Spațiu luminos pentru psihoterapie individuală" },
  { slug: "copii-si-adolescenti", title: "Copii și adolescenți", description: "Un spațiu dedicat dezvoltării armonioase a lumii emoționale, relaționale și comportamentale.", image: assets.children, imageAlt: "Detaliu cald din spațiul pentru copii și adolescenți" },
  { slug: "familii", title: "Familii", description: "Înțelegere, conectare și echilibru în relațiile care contează cel mai mult.", image: assets.families, imageAlt: "Canapea și fotolii într-un cabinet de terapie" },
  { slug: "seniori", title: "Seniori", description: "Sprijin pentru adaptare, sens și calitate a vieții în fiecare etapă a maturității.", image: assets.seniorService, imageAlt: "Atmosferă liniștită pentru consilierea seniorilor" },
  { slug: "adictii", title: "Adicții", description: "Un proces fără judecată, orientat spre înțelegere, recuperare și pași sustenabili.", image: assets.addictions, imageAlt: "Detaliu de interior pentru consiliere în adicții" },
  { slug: "formare-profesionala", title: "Formare profesională", description: "Formare și dezvoltare profesională construite pe rigoare, reflecție și aplicabilitate în contexte reale de lucru.", image: assets.training, imageAlt: "Materiale pentru formare profesională" },
]

const enServices: ServiceSummary[] = [
  { slug: "adulti", title: "Adults", description: "A space for clarity, emotional balance, and authentic change.", image: assets.adults, imageAlt: "Bright space for individual psychotherapy" },
  { slug: "copii-si-adolescenti", title: "Children and teenagers", description: "A space dedicated to the harmonious development of emotional, relational, and behavioural life.", image: assets.children, imageAlt: "Warm detail from the space for children and teenagers" },
  { slug: "familii", title: "Families", description: "Understanding, connection, and balance in the relationships that matter most.", image: assets.families, imageAlt: "Sofa and armchairs in a therapy room" },
  { slug: "seniori", title: "Older adults", description: "Support for adaptation, meaning, and quality of life at every stage of maturity.", image: assets.seniorService, imageAlt: "Calm atmosphere for older adult counselling" },
  { slug: "adictii", title: "Addiction support", description: "A non-judgmental process focused on understanding, recovery, and sustainable steps.", image: assets.addictions, imageAlt: "Interior detail for addiction counselling" },
  { slug: "formare-profesionala", title: "Professional training", description: "Training and professional development built on rigour, reflection, and real-world applicability.", image: assets.training, imageAlt: "Materials for professional training" },
]

const roHome: HomeContent = {
  eyebrow: "Psihoterapie & consiliere",
  title: "Înțelege profund. Trăiește conștient. Evoluează autentic.",
  lead: "Un spațiu sigur pentru a te reconecta cu tine, cu cei dragi și cu ceea ce contează.",
  cta: "Programează o întâlnire",
  introTitle: "EIKON MIND este expresia convingerii că schimbarea autentică începe prin înțelegere.",
  intro: "Într-un cadru cald, profesionist și lipsit de judecată, te însoțesc să privești cu mai multă claritate spre ceea ce trăiești și să găsești pașii care ți se potrivesc.",
  quote: "Pentru a schimba ceva, este nevoie mai întâi să înțelegi.",
  servicesTitle: "Servicii psihologice",
  servicesLead: "Mai mult decât terapie: un spațiu pentru claritate, respect și echilibru interior.",
  servicesQuote: "„Pentru mine, sănătatea mintală nu înseamnă doar reducerea suferinței. Înseamnă dezvoltarea capacității de a înțelege, de a alege conștient și de a construi o viață aflată în acord cu propriile valori.”",
  services: roServices,
  aboutTitle: "Despre mine",
  aboutRole: "Psiholog clinician, psihoterapeut cognitiv-comportamental, consilier în adicții și formator",
  aboutName: "Maria-Manuela Niță",
  aboutText: "Practica mea este fundamentată pe principiile psihologiei bazate pe dovezi și pe respectul profund pentru unicitatea fiecărei persoane.",
  aboutItems: ["Psihoterapie bazată pe dovezi științifice", "Evaluare clinică și psihodiagnostic", "Consiliere specializată în adicții", "Abordare umană, adaptată unicității tale"],
  marquee: "Meriți sprijin. Nu ești singur pe acest drum. Hai să facem primul pas împreună.",
  featureTitle: "Aici începe drumul spre claritate și echilibru interior.",
  featureText: "Într-o lume orientată către răspunsuri rapide, la Eikon Mind Iași creăm un spațiu dedicat reflecției și transformării durabile. Te privim dincolo de simptome, etichete sau dificultăți temporare. Sănătatea mintală nu înseamnă doar reducerea suferinței, ci dezvoltarea capacității de a alege conștient o viață în acord cu propriile valori.",
  benefitsEyebrow: "Beneficiile terapiei",
  benefitsTitle: "De ce funcționează terapia individuală?",
  benefitsLink: "Află mai multe despre terapie",
  benefits: ["Înțelegere mai clară a emoțiilor", "Instrumente practice pentru situații dificile", "Relații mai sănătoase și limite mai clare", "Mai multă încredere în propriile resurse"],
  recommendation: { quote: "Am recomandat-o pe Maria-Manuela pentru profesionalismul, empatia și atenția cu care își însoțește clienții. Lucrează cu rigoare, dar și cu multă căldură umană.", author: "Dumitru Pușcașu, Psihoterapeut Marea Britanie", link: "https://www.cbtandcoachingservices.com/" },
  testimonialsTitle: "Cuvinte de la oameni care au făcut primul pas",
  testimonials: [
    { quote: "Am învățat să înțeleg ce se întâmplă cu mine când apar stresul și anxietatea. Am plecat din terapie cu instrumente concrete și cu mai multă încredere.", author: "Elena M.", image: assets.testimonials[0] },
    { quote: "Am găsit un spațiu în care am putut vorbi sincer despre burnout și despre presiunea pe care o puneam singur asupra mea.", author: "Marius D.", image: assets.testimonials[1] },
    { quote: "Am început să văd tiparele care mă țineau pe loc și am învățat să îmi pun limite fără vinovăție.", author: "Ana P.", image: assets.testimonials[2] },
    { quote: "M-am simțit văzută și ascultată. Este un psiholog foarte bun în Iași și recomand cu încredere această experiență.", author: "Iulia T.", image: assets.testimonials[3] },
  ],
  sessionsTitle: "Cum putem lucra împreună",
  sessions: [
    { title: "Ședință individuală de psihoterapie", body: "Un spațiu confidențial în care explorăm ceea ce te preocupă, stabilim obiective realiste și construim împreună un plan de lucru potrivit nevoilor tale.", items: ["Plan de lucru personalizat", "Confidențialitate garantată", "Recomandări și resurse practice", "Programare flexibilă"], duration: "Durată ședință: 50 de minute" },
    { title: "Ședință de psihoterapie online", body: "Terapia online îți oferă continuitate și acces la sprijin indiferent de locul în care te afli, într-un cadru sigur și profesionist.", items: ["Platformă video securizată", "Aceeași eficiență ca la cabinet", "Resurse și fișe de lucru digitale", "Frecvență adaptată nevoilor tale"], duration: "Durată ședință: 50 de minute" },
    { title: "Ședințe de terapie de grup", body: "În grup, procesul terapeutic este susținut de validare, apartenență și învățare prin experiența celorlalți, cu ghidare profesională continuă.", items: ["Validare și sprijin reciproc", "Grupuri restrânse și sigure", "Învățare prin experiența celorlalți", "Ghidare profesională continuă"], duration: "Durată întâlnire: 90 - 120 de minute (în funcție de grup)" },
  ],
  blogTitle: "Blogul meu",
  blogText: "Resurse și gânduri pentru echilibrul tău",
  blogLink: "Explorează toate articolele",
  finalCta: "Ești gata să faci primul pas spre schimbare?",
  finalCtaButton: "Trimite cererea de programare",
}

const enHome: HomeContent = {
  eyebrow: "Psychotherapy & counselling",
  title: "Understand deeply. Live consciously. Evolve authentically.",
  lead: "A safe space to reconnect with yourself, your loved ones, and what matters.",
  cta: "Book a session",
  introTitle: "EIKON MIND expresses the belief that authentic change begins with understanding.",
  intro: "In a warm, professional, and judgement-free setting, I accompany you as you look with greater clarity at what you are experiencing and find the steps that fit you.",
  quote: "To change something, we first need to understand it.",
  servicesTitle: "Psychological services",
  servicesLead: "More than therapy: a space for clarity, respect, and inner balance.",
  servicesQuote: "“For me, mental health is not only about reducing suffering. It is about developing the capacity to understand, choose consciously, and build a life aligned with your own values.”",
  services: enServices,
  aboutTitle: "About me",
  aboutRole: "Clinical psychologist, cognitive-behavioural psychotherapist, addiction counsellor, and trainer",
  aboutName: "Maria-Manuela Niță",
  aboutText: "My practice is grounded in evidence-based psychology and in a deep respect for the uniqueness of every person.",
  aboutItems: ["Psychotherapy based on scientific evidence", "Clinical assessment and psychodiagnosis", "Specialised addiction counselling", "A human approach adapted to your uniqueness"],
  marquee: "You deserve support. You are not alone on this path. Let us take the first step together.",
  featureTitle: "This is where the path to clarity and inner balance begins.",
  featureText: "In a world oriented towards quick answers, Eikon Mind Iași creates a space for reflection and lasting transformation. We look beyond symptoms, labels, or temporary difficulties. Mental health is not only about reducing suffering, but about developing the capacity to consciously choose a life aligned with your values.",
  benefitsEyebrow: "The benefits of therapy",
  benefitsTitle: "Why does individual therapy work?",
  benefitsLink: "Learn more about therapy",
  benefits: ["A clearer understanding of emotions", "Practical tools for difficult situations", "Healthier relationships and clearer boundaries", "More trust in your own resources"],
  recommendation: { quote: "I have recommended Maria-Manuela for her professionalism, empathy, and care. She works with rigour while bringing a great deal of human warmth to the therapeutic relationship.", author: "Dumitru Pușcașu, Psychotherapist, United Kingdom", link: "https://www.cbtandcoachingservices.com/" },
  testimonialsTitle: "Words from people who took the first step",
  testimonials: [
    { quote: "I learned to understand what happens to me when stress and anxiety appear. I left therapy with concrete tools and more confidence.", author: "Elena M.", image: assets.testimonials[0] },
    { quote: "I found a space where I could speak honestly about burnout and the pressure I was putting on myself.", author: "Marius D.", image: assets.testimonials[1] },
    { quote: "I began to see the patterns that kept me stuck and learned to set boundaries without guilt.", author: "Ana P.", image: assets.testimonials[2] },
    { quote: "I felt seen and heard. She is a very good psychologist in Iași and I recommend the experience with confidence.", author: "Iulia T.", image: assets.testimonials[3] },
  ],
  sessionsTitle: "How we can work together",
  sessions: [
    { title: "Individual psychotherapy session", body: "A confidential space where we explore what concerns you, set realistic goals, and build a plan that fits your needs.", items: ["Personalised work plan", "Guaranteed confidentiality", "Practical recommendations and resources", "Flexible scheduling"], duration: "Session length: 50 minutes" },
    { title: "Online psychotherapy session", body: "Online therapy offers continuity and access to support wherever you are, within a safe and professional setting.", items: ["Secure video platform", "The same effectiveness as in-office work", "Digital resources and worksheets", "Frequency adapted to your needs"], duration: "Session length: 50 minutes" },
    { title: "Group therapy sessions", body: "In a group, the therapeutic process is supported by validation, belonging, and learning from others, with continuous professional guidance.", items: ["Validation and mutual support", "Small, safe groups", "Learning through others’ experience", "Ongoing professional guidance"], duration: "Meeting length: 90–120 minutes (depending on the group)" },
  ],
  blogTitle: "My blog",
  blogText: "Resources and reflections for your balance",
  blogLink: "Explore all articles",
  finalCta: "Are you ready to take the first step towards change?",
  finalCtaButton: "Send a booking request",
}

const roPages: Record<PublicSlug, PageContent> = {
  adulti: {
    kind: "service", title: "Adulți", description: "Un proces adaptat ritmului și nevoilor tale, pentru anxietate, stres, blocaje și momente de schimbare.", image: assets.adults, imageAlt: "Spațiu de psihoterapie pentru adulți", cta: "Programează o întâlnire",
    sections: [
      { title: "Evaluare psihologică clinică și psihodiagnostic", items: ["Evaluarea funcționării emoționale, cognitive și comportamentale", "Evaluarea personalității și a tiparelor de funcționare", "Evaluarea simptomatologiei psihologice", "Înțelegerea dificultăților de adaptare și a factorilor de vulnerabilitate", "Identificarea resurselor personale și a factorilor de protecție", "Formulare clinică și recomandări pentru intervenție"] },
      { title: "Psihoterapie cognitiv-comportamentală", items: ["Anxietate și tulburări asociate", "Depresie și dificultăți afective", "Simptome somatice și dificultăți asociate stresului", "Stres și adaptare", "Burnout și sănătate ocupațională", "Relația cu sine", "Relații și comunicare", "Traumă și experiențe adverse de viață", "Pierdere, doliu și tranziții de viață", "Dezvoltare personală și valorificarea resurselor personale"] },
    ],
  },
  "copii-si-adolescenti": {
    kind: "service", title: "Copii și adolescenți", description: "Sprijin blând pentru copii, adolescenți și familiile lor, într-un cadru de încredere și siguranță.", image: assets.children, imageAlt: "Spațiu primitor pentru copii și adolescenți", cta: "Programează o întâlnire",
    sections: [
      { title: "Evaluare psihologică și a dezvoltării", items: ["Evaluarea dezvoltării cognitive, emoționale și sociale", "Evaluarea atenției, memoriei și funcțiilor executive", "Evaluarea limbajului și a abilităților de învățare", "Evaluarea comportamentului și a adaptării", "Identificarea dificultăților emoționale și relaționale", "Identificarea resurselor și a ariilor de dezvoltare", "Recomandări personalizate pentru copil și familie"] },
      { title: "Intervenție psihologică adaptată vârstei și particularităților de dezvoltare", paragraphs: ["Intervenția este construită în jurul copilului, folosind jocul, conversația și exercițiile potrivite vârstei. Părinții sunt implicați acolo unde este util pentru susținerea schimbării în viața de zi cu zi."] },
      { title: "Emoții și sănătate emoțională", items: ["Anxietate, frici și îngrijorare excesivă", "Tristețe, retragere și simptome depresive", "Gestionarea furiei și a frustrării", "Reglare emoțională și toleranța la disconfort", "Încredere în sine și imagine de sine", "Perfecționism și presiune școlară", "Stres și dificultăți de adaptare", "Somn și rutine"] },
      { title: "Comportament și adaptare", items: ["Dificultăți de respectare a limitelor", "Impulsivitate și autocontrol", "Comportamente de evitare sau opoziție", "Adaptare la grădiniță și școală", "Schimbări comportamentale bruște", "Utilizarea problematică a tehnologiei"] },
      { title: "Relații și competențe sociale", items: ["Dificultăți de conectare cu ceilalți", "Conflicte cu frații sau colegii", "Bullying și excludere", "Comunicare și exprimarea nevoilor", "Empatie și cooperare", "Construirea relațiilor sigure"] },
      { title: "Încredere în sine și dezvoltare personală", items: ["Identificarea calităților și resurselor", "Autonomie și responsabilitate", "Luarea deciziilor", "Motivație și perseverență", "Adaptarea la schimbare"] },
      { title: "Evenimente dificile și experiențe adverse de viață", items: ["Separarea sau divorțul părinților", "Pierderea unei persoane importante", "Mutarea sau schimbarea școlii", "Experiențe de abuz sau neglijare", "Boală, dizabilitate sau schimbări familiale", "Alte situații care afectează sentimentul de siguranță"] },
      { title: "Dezvoltare și stimulare cognitivă", items: ["Atenție și concentrare", "Memorie și organizare", "Planificare și rezolvarea problemelor", "Strategii de învățare", "Motivație școlară", "Gestionarea procrastinării", "Pregătirea pentru evaluări", "Dezvoltarea flexibilității cognitive", "Valorificarea potențialului personal"] },
      { title: "Consiliere parentală", items: ["Înțelegerea nevoilor copilului", "Limite, reguli și consecvență", "Comunicare părinte–copil", "Sprijin pentru părinte în situații dificile"] },
    ],
  },
  familii: {
    kind: "service", title: "Familii", description: "Relațiile pot deveni mai clare atunci când există spațiu pentru ascultare, dialog și reconectare.", image: assets.families, imageAlt: "Cabinet pentru întâlniri de familie", cta: "Programează o întâlnire",
    sections: [{ title: "Intervenții pentru sistemul familial", paragraphs: ["Lucrăm cu familia ca întreg, pentru a înțelege tiparele relaționale și pentru a crea modalități mai sănătoase de conectare și cooperare."], items: ["Îmbunătățirea comunicării", "Gestionarea conflictelor", "Adaptarea la schimbări familiale", "Consolidarea relațiilor și a cooperării în familie"] }],
  },
  seniori: {
    kind: "service", title: "Seniori", description: "Un loc pentru poveștile, pierderile, adaptările și resursele acestei etape de viață.", image: assets.seniorService, imageAlt: "Spațiu calm pentru consilierea seniorilor", cta: "Programează o întâlnire",
    sections: [{ title: "Evaluare și suport psihologic", paragraphs: ["Sprijinul psihologic poate susține adaptarea, păstrarea autonomiei și construirea unui sens personal în fiecare etapă a maturității."], items: ["Adaptarea la schimbările asociate înaintării în vârstă", "Gestionarea pierderilor și a procesului de doliu", "Sprijin în fața bolii cronice", "Adaptarea la modificările rolurilor familiale și sociale", "Menținerea echilibrului emoțional și a calității vieții"] }],
  },
  adictii: {
    kind: "service", title: "Adicții", description: "Un proces fără judecată, orientat spre înțelegere, recuperare și pași sustenabili.", image: assets.addictions, imageAlt: "Detaliu din spațiul pentru consilierea în adicții", cta: "Programează o întâlnire",
    sections: [
      { title: "Evaluare și consiliere specializată", items: ["Consum problematic de alcool", "Consum de substanțe psihoactive", "Utilizarea abuzivă a medicamentelor", "Jocuri de noroc", "Dependențe comportamentale și utilizarea problematică a tehnologiei"] },
      { title: "Recuperare și prevenirea recăderilor", items: ["Dezvoltarea motivației pentru schimbare", "Managementul cravingului", "Identificarea factorilor de risc", "Strategii pentru prevenirea recăderilor", "Menținerea schimbării pe termen lung"] },
      { title: "Intervenții pentru familie și aparținători", items: ["Psihoeducație", "Stabilirea limitelor sănătoase", "Înțelegerea mecanismelor dependenței", "Susținerea procesului de recuperare"] },
    ],
  },
  "formare-profesionala": {
    kind: "service", title: "Formare profesională", description: "Formare și dezvoltare profesională construite pe rigoare, reflecție și aplicabilitate în contexte reale de lucru.", image: assets.training, imageAlt: "Materiale pentru formare și dezvoltare profesională", cta: "Solicită detalii",
    sections: [{ title: "Arii de expertiză", paragraphs: ["Programe, workshopuri și intervenții educaționale pentru profesioniști și organizații care vor să investească în sănătate mintală, relații și performanță sustenabilă."], items: ["Burnout și sănătate ocupațională", "Managementul furiei și al conflictelor", "Prevenirea violenței", "Prevenirea consumului de substanțe și a dependențelor", "Dezvoltarea competențelor profesionale", "Sănătate mintală și psihoeducație", "Reziliență și adaptare", "Comunicare și relaționare"] }],
  },
  "despre-mine": {
    kind: "about", title: "Despre mine", description: "Sunt Maria-Manuela Niță, psiholog clinician, psihoterapeut cognitiv-comportamental, consilier în adicții și formator.", image: assets.about, imageAlt: "Maria-Manuela Niță în natură", cta: "Hai să vorbim",
    gallery: [assets.portrait, assets.office, assets.sunset],
    sections: [
      { title: "Sunt aici pentru tine", paragraphs: ["Sunt Maria-Manuela Niță și cred că fiecare om are nevoie, uneori, de un spațiu în care să poată fi ascultat cu adevărat. Practica mea este fundamentată pe psihologia bazată pe dovezi, dar relația terapeutică rămâne profund umană, personală și adaptată ritmului tău."], items: ["Psihoterapie bazată pe dovezi științifice", "Evaluare clinică și psihodiagnostic", "Consiliere specializată în adicții", "Abordare umană, adaptată unicității tale"] },
      { title: "Filosofia practicii", paragraphs: ["Cred că schimbarea autentică începe prin înțelegere. Împreună privim cu curiozitate la emoții, gânduri, comportamente și relații, pentru ca tu să poți alege conștient pașii care te apropie de valorile tale."] },
      { title: "Valorile EIKON MIND", items: ["Respect pentru unicitatea fiecărei persoane", "Rigoare profesională și practică bazată pe dovezi", "Siguranță, confidențialitate și lipsa judecății", "Colaborare și autonomie în procesul terapeutic"] },
      { title: "Promisiunea EIKON MIND", paragraphs: ["Îți ofer un cadru sigur, clar și cald, în care dificultățile tale pot fi înțelese fără etichete și în care resursele tale pot deveni puncte de sprijin pentru schimbare."] },
    ],
  },
  programare: { kind: "booking", title: "Programare", description: "Alege o întâlnire potrivită pentru tine. Pentru rezervare vei fi direcționat către contul tău securizat.", image: assets.cabinet, imageAlt: "Cabinet de psihoterapie", cta: "Înscrie-te pentru o programare", sections: [{ title: "Înscrie-te pentru o programare", paragraphs: ["Poți solicita o întâlnire individuală, online sau de grup. Pentru a vedea disponibilitatea și a trimite cererea, continuă către spațiul securizat al aplicației."] }] },
  contact: { kind: "contact", title: "Începe parcursul tău spre schimbare – Stabilim o întâlnire?", description: "Sunt aici pentru a te însoți în călătoria ta spre echilibru și bine.", image: assets.contact, imageAlt: "Colț luminos din cabinetul Eikon Mind", cta: "Programează o întâlnire", contact: { phone: "+40 744 897 013", email: "contact@eikon-mind.ro", address: "Strada Vasile Lupu nr. 83, Iași, România", hours: ["Luni – Vineri: 09:00 – 19:00", "Sâmbătă – Duminică: Închis"] }, sections: [{ title: "Discută direct cu mine:", paragraphs: ["Indiferent dacă ai întrebări despre serviciile mele, vrei să programezi o ședință la cabinetul din Iași sau online, ori pur și simplu ai nevoie de îndrumare, îți stau la dispoziție cu căldură și profesionalism."] }, { title: "Locația", paragraphs: ["Strada Vasile Lupu nr. 83, Iași, România"] }, { title: "Pune o Întrebare", paragraphs: ["Pentru orice întrebare despre servicii, programări sau colaborări, mă poți contacta direct. Îți voi răspunde cât mai curând posibil."] }] },
  "blog-page": { kind: "blog", title: "Blogul Eikon Mind", description: "Resurse și gânduri pentru echilibrul tău.", image: assets.imageOne, imageAlt: "Caiet și lumină caldă într-un spațiu de reflecție", cta: "Programează o întâlnire", sections: [{ title: "Blog Page", paragraphs: ["Un spațiu pentru reflecții, resurse și idei care pot susține starea de bine. Articolele vor fi adăugate în curând."] }] },
  "anpc-protectia-consumatorilor": { kind: "legal", title: "ANPC – Protecția consumatorilor", description: "Informații privind protecția consumatorilor și soluționarea alternativă a litigiilor.", sections: [{ title: "Informații generale", paragraphs: ["Acest site este administrat de Eikon Mind – Cabinet individual de psihologie, cu respectarea legislației române privind protecția consumatorilor și furnizarea serviciilor psihologice.", "Pentru soluționarea amiabilă a unei sesizări, te rugăm să ne contactezi direct folosind datele de mai jos."] }, { title: "Date de identificare", paragraphs: ["Eikon Mind – Cabinet individual de psihologie", "Psiholog clinician și psihoterapeut: Maria-Manuela Niță", "Sediu profesional: Strada Vasile Lupu nr. 83, Iași, România"] }, { title: "Soluționarea alternativă a litigiilor (SAL)", paragraphs: ["În cazul în care o situație nu poate fi rezolvată direct, consumatorii pot apela la procedurile de soluționare alternativă a litigiilor puse la dispoziție de autoritățile competente din România."] }, { title: "Contact și sesizări", paragraphs: ["Telefon: +40 744 897 013", "E-mail: contact@eikon-mind.ro", "Orice sesizare va fi analizată cu atenție și va primi un răspuns într-un termen rezonabil."] }, { title: "Drepturile consumatorilor", items: ["Dreptul la informare corectă, completă și transparentă", "Dreptul la servicii furnizate cu profesionalism și bună-credință", "Dreptul la protecția datelor cu caracter personal", "Dreptul de a formula sesizări și reclamații"] }], },
  "politica-de-confidentialitate": { kind: "legal", title: "Politica de confidențialitate", description: "Protejăm datele personale și le folosim numai pentru furnizarea serviciilor solicitate.", sections: [{ title: "1. Introducere", paragraphs: ["Prezenta politică explică modul în care Eikon Mind colectează, utilizează și protejează datele cu caracter personal ale vizitatorilor și utilizatorilor site-ului.", "Respectăm Regulamentul (UE) 2016/679 (GDPR) și legislația națională aplicabilă."] }, { title: "2. Operatorul datelor", paragraphs: ["Operatorul datelor este Eikon Mind – Cabinet individual de psihologie, Strada Vasile Lupu nr. 83, Iași, România. Pentru întrebări privind datele personale ne poți scrie la contact@eikon-mind.ro."] }, { title: "3. Ce date colectăm", items: ["Date de identificare și contact, atunci când alegi să ne contactezi", "Date necesare pentru crearea și utilizarea contului de client", "Date legate de programări și comunicarea cu cabinetul", "Date tehnice necesare pentru securitatea și funcționarea site-ului"] }, { title: "4. Scopul și temeiul prelucrării", paragraphs: ["Folosim datele pentru a răspunde solicitărilor, a administra programările, a furniza serviciile solicitate, a securiza conturile și a respecta obligațiile legale. Temeiul poate fi executarea unui contract, consimțământul, obligația legală sau interesul legitim."] }, { title: "5. Păstrarea datelor", paragraphs: ["Păstrăm datele doar atât timp cât este necesar pentru scopul pentru care au fost colectate, pentru furnizarea serviciilor și pentru îndeplinirea termenelor legale de arhivare."] }, { title: "6. Partajarea datelor", paragraphs: ["Nu vindem datele personale. Le putem transmite furnizorilor tehnici care ne sprijină în operarea site-ului și aplicației, doar în măsura necesară și cu obligații de confidențialitate."] }, { title: "7. Drepturile tale", items: ["Dreptul de acces, rectificare și ștergere", "Dreptul la restricționarea prelucrării", "Dreptul la portabilitatea datelor", "Dreptul de a te opune prelucrării", "Dreptul de a retrage consimțământul", "Dreptul de a depune o plângere la autoritatea de supraveghere"] }, { title: "8. Securitate", paragraphs: ["Aplicăm măsuri tehnice și organizatorice rezonabile pentru a proteja datele împotriva accesului neautorizat, pierderii, modificării sau divulgării."] }, { title: "9. Datele minorilor", paragraphs: ["Serviciile pentru copii și adolescenți sunt accesate cu implicarea și acordul reprezentantului legal, acolo unde legea o impune."] }, { title: "10. Actualizări", paragraphs: ["Putem actualiza această politică pentru a reflecta schimbări legislative sau ale serviciilor. Versiunea publicată pe această pagină este cea în vigoare.", "Ultima actualizare: 22 iunie 2026."] }], },
  "politica-de-cookies": { kind: "legal", title: "Politica de cookies", description: "Acest site folosește cookie-uri necesare funcționării și, acolo unde este cazul, pentru preferințe și analiză.", sections: [{ title: "1. Ce sunt cookie-urile", paragraphs: ["Cookie-urile sunt fișiere mici stocate în browserul dispozitivului tău. Ele ajută site-ul să funcționeze, să rețină preferințe și să înțeleagă modul în care este utilizat."] }, { title: "2. Cum folosim cookie-urile", paragraphs: ["Folosim cookie-uri esențiale pentru securitate, sesiune și funcționarea aplicației, precum și cookie-uri funcționale pentru preferințe. Cookie-urile de analiză sunt folosite numai în condițiile permise de legislația aplicabilă."] }, { title: "3. Tipuri de cookie-uri", paragraphs: ["Cookie-urile de sesiune sunt șterse la închiderea browserului, iar cele persistente rămân pentru o perioadă limitată. Unele cookie-uri pot fi setate de servicii tehnice integrate în site."] }, { title: "4. Lista cookie-urilor", paragraphs: ["Lista de mai jos descrie cookie-urile observate sau utilizate în mod obișnuit pentru funcționarea site-ului."] }, { title: "5. Gestionarea cookie-urilor", paragraphs: ["Poți modifica setările din browser pentru a bloca sau șterge cookie-uri. Dezactivarea celor esențiale poate afecta autentificarea și funcționarea anumitor zone ale aplicației."] }, { title: "6. Cookie-uri terțe părți", paragraphs: ["Unele servicii externe pot seta propriile cookie-uri. Consultă politicile furnizorilor respectivi pentru detalii despre utilizarea datelor."] }, { title: "7. Actualizări", paragraphs: ["Politica poate fi actualizată când se schimbă tehnologiile sau cerințele legale. Ultima actualizare: 22 iunie 2026."] }], table: { headers: ["Cookie", "Tip", "Scop", "Durată"], rows: [["_ga, _gid, _gat (Google Analytics)", "Analiză", "Statistici anonime de trafic", "2 ani / 24 ore"], ["wordpress_sec_, wordpress_logged_in_", "Esențial", "Securitate și sesiune utilizator (dacă sunteți logat)", "Sesiune"], ["cookielawinfo-checkbox-*", "Funcțional", "Stocare consimțământ cookies", "1 an"], ["Alte cookie-uri tehnice", "Funcțional", "Funcționarea site-ului", "Sesiune / 1 an"]] } },
  "termeni-si-conditii": { kind: "legal", title: "Termeni și condiții", description: "Folosirea site-ului și a serviciilor este guvernată de acești termeni și condiții.", sections: [{ title: "1. Dispoziții generale", paragraphs: ["Site-ul Eikon Mind oferă informații despre servicii psihologice și un spațiu digital pentru comunicare și programări. Prin utilizarea site-ului accepți acești termeni."] }, { title: "2. Serviciile prezentate", paragraphs: ["Informațiile publicate au caracter general și nu înlocuiesc evaluarea sau recomandarea personalizată a unui specialist. Serviciile pot fi oferite la cabinet, online sau în grup, în funcție de disponibilitate și potrivire."] }, { title: "3. Programări și conturi", paragraphs: ["Pentru programări poți fi direcționat către zona securizată a aplicației. Ești responsabil pentru corectitudinea datelor furnizate și pentru păstrarea confidențialității datelor de acces."] }, { title: "4. Anularea și reprogramarea", paragraphs: ["Dacă nu poți ajunge la o întâlnire, te rugăm să anunți cabinetul cât mai devreme pentru a putea reprograma. Condițiile concrete sunt comunicate la stabilirea întâlnirii."] }, { title: "5. Conținutul site-ului", paragraphs: ["Textele, imaginile, identitatea vizuală și structura site-ului aparțin Eikon Mind sau sunt utilizate cu drept. Reproducerea fără acord este interzisă."] }, { title: "6. Utilizare acceptabilă", paragraphs: ["Nu este permisă utilizarea site-ului pentru activități ilegale, atacuri asupra infrastructurii, transmiterea de conținut abuziv sau încercarea de a accesa datele altor utilizatori."] }, { title: "7. Limitarea răspunderii", paragraphs: ["Depunem eforturi pentru ca informațiile să fie corecte și site-ul disponibil, însă nu garantăm lipsa totală a erorilor sau întreruperilor. Nu răspundem pentru decizii luate exclusiv pe baza informațiilor generale de pe site."] }, { title: "8. Confidențialitate", paragraphs: ["Prelucrarea datelor personale este descrisă în Politica de confidențialitate, care face parte din cadrul de utilizare al site-ului."] }, { title: "9. Linkuri externe", paragraphs: ["Site-ul poate include linkuri către resurse externe. Eikon Mind nu controlează conținutul sau politicile acelor site-uri."] }, { title: "10. Modificarea termenilor", paragraphs: ["Termenii pot fi actualizați pentru a reflecta schimbări ale serviciilor sau ale legislației. Versiunea curentă este cea publicată pe această pagină."] }, { title: "11. Contact", paragraphs: ["Pentru întrebări despre acești termeni, ne poți contacta la contact@eikon-mind.ro sau la +40 744 897 013."] }], },
}

const enPages: Record<PublicSlug, PageContent> = {
  adulti: { kind: "service", title: "Adults", description: "A process tailored to your pace and needs, for anxiety, stress, blocks, and periods of change.", image: assets.adults, imageAlt: "Psychotherapy space for adults", cta: "Book a session", sections: [{ title: "Clinical psychological assessment and psychodiagnosis", items: ["Assessment of emotional, cognitive, and behavioural functioning", "Assessment of personality and patterns of functioning", "Assessment of psychological symptoms", "Understanding adaptation difficulties and vulnerability factors", "Identifying personal resources and protective factors", "Clinical formulation and intervention recommendations"] }, { title: "Cognitive-behavioural psychotherapy", items: ["Anxiety and related disorders", "Depression and affective difficulties", "Somatic symptoms and stress-related difficulties", "Stress and adaptation", "Burnout and occupational health", "Relationship with self", "Relationships and communication", "Trauma and adverse life experiences", "Loss, grief, and life transitions", "Personal development and using personal resources"] }] },
  "copii-si-adolescenti": { kind: "service", title: "Children and teenagers", description: "Gentle support for children, teenagers, and their families in a trusted and safe setting.", image: assets.children, imageAlt: "Welcoming space for children and teenagers", cta: "Book a session", sections: [{ title: "Psychological and developmental assessment", items: ["Assessment of cognitive, emotional, and social development", "Assessment of attention, memory, and executive functions", "Assessment of language and learning skills", "Assessment of behaviour and adaptation", "Identifying emotional and relational difficulties", "Identifying resources and areas for development", "Personalised recommendations for the child and family"] }, { title: "Age-appropriate psychological intervention", paragraphs: ["The intervention is built around the child, using play, conversation, and exercises suited to their age. Parents are involved whenever useful for supporting change in everyday life."] }, { title: "Emotions and emotional health", items: ["Anxiety, fears, and excessive worry", "Sadness, withdrawal, and depressive symptoms", "Managing anger and frustration", "Emotional regulation and tolerance of discomfort", "Self-confidence and self-image", "Perfectionism and school pressure", "Stress and adaptation difficulties", "Sleep and routines"] }, { title: "Behaviour and adaptation", items: ["Difficulties respecting boundaries", "Impulsivity and self-control", "Avoidant or oppositional behaviours", "Adaptation to kindergarten and school", "Sudden behavioural changes", "Problematic technology use"] }, { title: "Relationships and social skills", items: ["Difficulties connecting with others", "Conflicts with siblings or peers", "Bullying and exclusion", "Communication and expressing needs", "Empathy and cooperation", "Building safe relationships"] }, { title: "Self-confidence and personal development", items: ["Identifying qualities and resources", "Autonomy and responsibility", "Decision-making", "Motivation and perseverance", "Adapting to change"] }, { title: "Difficult events and adverse life experiences", items: ["Parental separation or divorce", "Loss of an important person", "Moving or changing school", "Experiences of abuse or neglect", "Illness, disability, or family changes", "Other situations affecting the sense of safety"] }, { title: "Cognitive development and stimulation", items: ["Attention and concentration", "Memory and organisation", "Planning and problem-solving", "Learning strategies", "School motivation", "Managing procrastination", "Preparing for assessments", "Developing cognitive flexibility", "Making the most of personal potential"] }, { title: "Parent counselling", items: ["Understanding the child’s needs", "Boundaries, rules, and consistency", "Parent–child communication", "Support for parents in difficult situations"] }] },
  familii: { kind: "service", title: "Families", description: "Relationships become clearer when there is room for listening, dialogue, and reconnection.", image: assets.families, imageAlt: "Family therapy room", cta: "Book a session", sections: [{ title: "Interventions for the family system", paragraphs: ["We work with the family as a whole to understand relational patterns and create healthier ways of connecting and cooperating."], items: ["Improving communication", "Managing conflict", "Adapting to family changes", "Strengthening relationships and cooperation in the family"] }] },
  seniori: { kind: "service", title: "Older adults", description: "A place for the stories, losses, adaptations, and resources of this stage of life.", image: assets.seniorService, imageAlt: "Calm space for older adult counselling", cta: "Book a session", sections: [{ title: "Psychological assessment and support", paragraphs: ["Psychological support can help with adaptation, maintaining autonomy, and building personal meaning at every stage of maturity."], items: ["Adapting to changes associated with ageing", "Managing loss and the grief process", "Support in the face of chronic illness", "Adapting to changes in family and social roles", "Maintaining emotional balance and quality of life"] }] },
  adictii: { kind: "service", title: "Addiction support", description: "A non-judgmental process focused on understanding, recovery, and sustainable steps.", image: assets.addictions, imageAlt: "Detail from an addiction counselling space", cta: "Book a session", sections: [{ title: "Specialised assessment and counselling", items: ["Problematic alcohol use", "Psychoactive substance use", "Abusive use of medication", "Gambling", "Behavioural addictions and problematic technology use"] }, { title: "Recovery and relapse prevention", items: ["Building motivation for change", "Craving management", "Identifying risk factors", "Relapse prevention strategies", "Maintaining long-term change"] }, { title: "Support for families and significant others", items: ["Psychoeducation", "Setting healthy boundaries", "Understanding addiction mechanisms", "Supporting the recovery process"] }] },
  "formare-profesionala": { kind: "service", title: "Professional training", description: "Training and professional development built on rigour, reflection, and real-world applicability.", image: assets.training, imageAlt: "Materials for professional development", cta: "Request details", sections: [{ title: "Areas of expertise", paragraphs: ["Programmes, workshops, and educational interventions for professionals and organisations investing in mental health, relationships, and sustainable performance."], items: ["Burnout and occupational health", "Anger and conflict management", "Violence prevention", "Prevention of substance use and addictions", "Professional skills development", "Mental health and psychoeducation", "Resilience and adaptation", "Communication and relationships"] }] },
  "despre-mine": { kind: "about", title: "About me", description: "I am Maria-Manuela Niță, a clinical psychologist, cognitive-behavioural psychotherapist, addiction counsellor, and trainer.", image: assets.about, imageAlt: "Maria-Manuela Niță in nature", cta: "Let’s talk", gallery: [assets.portrait, assets.office, assets.sunset], sections: [{ title: "I am here for you", paragraphs: ["I am Maria-Manuela Niță and I believe that everyone sometimes needs a space where they can truly be heard. My practice is grounded in evidence-based psychology, while the therapeutic relationship remains deeply human, personal, and adapted to your pace."], items: ["Psychotherapy based on scientific evidence", "Clinical assessment and psychodiagnosis", "Specialised addiction counselling", "A human approach adapted to your uniqueness"] }, { title: "The practice philosophy", paragraphs: ["I believe authentic change begins with understanding. Together we look with curiosity at emotions, thoughts, behaviours, and relationships, so that you can consciously choose the steps that bring you closer to your values."] }, { title: "The EIKON MIND values", items: ["Respect for each person’s uniqueness", "Professional rigour and evidence-based practice", "Safety, confidentiality, and freedom from judgement", "Collaboration and autonomy in the therapeutic process"] }, { title: "The EIKON MIND promise", paragraphs: ["I offer a safe, clear, and warm setting where your difficulties can be understood without labels and your resources can become foundations for change."] }] },
  programare: { kind: "booking", title: "Booking", description: "Choose a meeting that suits you. To make a reservation, you will be taken to your secure account.", image: assets.cabinet, imageAlt: "Psychotherapy room", cta: "Sign up for a booking", sections: [{ title: "Sign up for a booking", paragraphs: ["You can request an individual, online, or group session. To view availability and send a request, continue to the secure area of the app."] }] },
  contact: { kind: "contact", title: "Begin your path towards change – shall we meet?", description: "I am here to accompany you on your journey towards balance and wellbeing.", image: assets.contact, imageAlt: "Bright corner of the Eikon Mind office", cta: "Book a session", contact: { phone: "+40 744 897 013", email: "contact@eikon-mind.ro", address: "83 Vasile Lupu Street, Iași, Romania", hours: ["Monday – Friday: 09:00 – 19:00", "Saturday – Sunday: Closed"] }, sections: [{ title: "Talk to me directly:", paragraphs: ["Whether you have questions about my services, want to book an in-office session in Iași or an online session, or simply need guidance, I am here for you with warmth and professionalism."] }, { title: "Location", paragraphs: ["83 Vasile Lupu Street, Iași, Romania"] }, { title: "Ask a question", paragraphs: ["For any question about services, bookings, or collaborations, contact me directly. I will reply as soon as possible."] }] },
  "blog-page": { kind: "blog", title: "The Eikon Mind blog", description: "Resources and reflections for your balance.", image: assets.imageOne, imageAlt: "Notebook and warm light in a space for reflection", cta: "Book a session", sections: [{ title: "Blog Page", paragraphs: ["A space for reflections, resources, and ideas that support wellbeing. Articles will be added soon."] }] },
  "anpc-protectia-consumatorilor": { kind: "legal", title: "Consumer protection", description: "Information on consumer protection and alternative dispute resolution.", sections: [{ title: "General information", paragraphs: ["This website is operated by Eikon Mind – Individual Psychology Practice, in accordance with Romanian legislation on consumer protection and the provision of psychological services.", "For an amicable resolution of a complaint, please contact us directly using the details below."] }, { title: "Identification details", paragraphs: ["Eikon Mind – Individual Psychology Practice", "Clinical psychologist and psychotherapist: Maria-Manuela Niță", "Professional address: 83 Vasile Lupu Street, Iași, Romania"] }, { title: "Alternative dispute resolution", paragraphs: ["Where a matter cannot be resolved directly, consumers may use the alternative dispute resolution procedures made available by the competent Romanian authorities."] }, { title: "Contact and complaints", paragraphs: ["Phone: +40 744 897 013", "E-mail: contact@eikon-mind.ro", "Every complaint will be carefully reviewed and answered within a reasonable period."] }, { title: "Consumer rights", items: ["The right to correct, complete, and transparent information", "The right to services delivered professionally and in good faith", "The right to protection of personal data", "The right to submit complaints and notifications"] }] },
  "politica-de-confidentialitate": { kind: "legal", title: "Privacy policy", description: "We protect personal data and use it only to provide the requested services.", sections: [{ title: "1. Introduction", paragraphs: ["This policy explains how Eikon Mind collects, uses, and protects the personal data of website visitors and users.", "We comply with Regulation (EU) 2016/679 (GDPR) and applicable national law."] }, { title: "2. Data controller", paragraphs: ["The data controller is Eikon Mind – Individual Psychology Practice, 83 Vasile Lupu Street, Iași, Romania. For questions about personal data, write to contact@eikon-mind.ro."] }, { title: "3. Data we collect", items: ["Identification and contact data when you choose to contact us", "Data needed to create and use a client account", "Data related to bookings and communication with the practice", "Technical data needed for website security and operation"] }, { title: "4. Purpose and legal basis", paragraphs: ["We use data to answer requests, administer bookings, provide requested services, secure accounts, and meet legal obligations. The basis may be contract performance, consent, a legal obligation, or legitimate interest."] }, { title: "5. Data retention", paragraphs: ["We keep data only for as long as needed for the purpose for which it was collected, to provide services, and to meet legal archiving periods."] }, { title: "6. Sharing data", paragraphs: ["We do not sell personal data. We may share it with technical providers who help us operate the website and application, only as necessary and under confidentiality obligations."] }, { title: "7. Your rights", items: ["Access, rectification, and erasure", "Restriction of processing", "Data portability", "Objection to processing", "Withdrawal of consent", "Lodging a complaint with the supervisory authority"] }, { title: "8. Security", paragraphs: ["We apply reasonable technical and organisational measures to protect data against unauthorised access, loss, alteration, or disclosure."] }, { title: "9. Children’s data", paragraphs: ["Services for children and teenagers are accessed with the involvement and consent of a legal representative where required by law."] }, { title: "10. Updates", paragraphs: ["We may update this policy to reflect legal or service changes. The version published on this page is the current version.", "Last updated: 22 June 2026."] }] },
  "politica-de-cookies": { kind: "legal", title: "Cookie policy", description: "This website uses cookies needed for operation and, where applicable, for preferences and analytics.", sections: [{ title: "1. What cookies are", paragraphs: ["Cookies are small files stored in your device’s browser. They help the website work, remember preferences, and understand how it is used."] }, { title: "2. How we use cookies", paragraphs: ["We use essential cookies for security, sessions, and application operation, as well as functional cookies for preferences. Analytics cookies are used only where permitted by applicable law."] }, { title: "3. Cookie types", paragraphs: ["Session cookies are deleted when you close the browser, while persistent cookies remain for a limited period. Some cookies may be set by technical services integrated into the website."] }, { title: "4. Cookie list", paragraphs: ["The table below describes cookies observed or commonly used for the website’s operation."] }, { title: "5. Managing cookies", paragraphs: ["You can change your browser settings to block or delete cookies. Disabling essential cookies may affect sign-in and parts of the application."] }, { title: "6. Third-party cookies", paragraphs: ["Some external services may set their own cookies. Consult the relevant providers’ policies for details about data use."] }, { title: "7. Updates", paragraphs: ["This policy may be updated when technologies or legal requirements change. Last updated: 22 June 2026."] }], table: { headers: ["Cookie", "Type", "Purpose", "Duration"], rows: [["_ga, _gid, _gat (Google Analytics)", "Analytics", "Anonymous traffic statistics", "2 years / 24 hours"], ["wordpress_sec_, wordpress_logged_in_", "Essential", "User security and session (when signed in)", "Session"], ["cookielawinfo-checkbox-*", "Functional", "Storing cookie consent", "1 year"], ["Other technical cookies", "Functional", "Website operation", "Session / 1 year"]] } },
  "termeni-si-conditii": { kind: "legal", title: "Terms and conditions", description: "Use of this website and its services is governed by these terms and conditions.", sections: [{ title: "1. General provisions", paragraphs: ["The Eikon Mind website provides information about psychological services and a digital space for communication and bookings. By using the website, you accept these terms."] }, { title: "2. Services presented", paragraphs: ["Published information is general in nature and does not replace an individual assessment or recommendation from a specialist. Services may be offered in-office, online, or in groups, subject to availability and suitability."] }, { title: "3. Bookings and accounts", paragraphs: ["For bookings you may be directed to the secure area of the application. You are responsible for the accuracy of the information provided and for keeping access details confidential."] }, { title: "4. Cancellation and rescheduling", paragraphs: ["If you cannot attend an appointment, please inform the practice as early as possible so it can be rescheduled. Specific conditions are communicated when the appointment is arranged."] }, { title: "5. Website content", paragraphs: ["The texts, images, visual identity, and structure of the website belong to Eikon Mind or are used with permission. Reproduction without consent is prohibited."] }, { title: "6. Acceptable use", paragraphs: ["You may not use the website for illegal activity, attacks on infrastructure, abusive content, or attempts to access other users’ data."] }, { title: "7. Limitation of liability", paragraphs: ["We make reasonable efforts to keep information correct and the website available, but cannot guarantee the absence of errors or interruptions. We are not responsible for decisions based solely on general website information."] }, { title: "8. Privacy", paragraphs: ["Personal data processing is described in the Privacy policy, which forms part of the website’s terms of use."] }, { title: "9. External links", paragraphs: ["The website may include links to external resources. Eikon Mind does not control the content or policies of those websites."] }, { title: "10. Changes to the terms", paragraphs: ["The terms may be updated to reflect service or legal changes. The current version is the one published on this page."] }, { title: "11. Contact", paragraphs: ["For questions about these terms, contact contact@eikon-mind.ro or +40 744 897 013."] }] },
}

// These overrides replace legacy CMS-imported privacy/cookie text. Legal and
// controller review is still required before publishing either policy.
roPages["politica-de-confidentialitate"] = {
  kind: "legal",
  title: "Politica de confidențialitate",
  description: "Această aplicație prelucrează date minime pentru conturi și programări; nu este un dosar medical.",
  sections: [
    { title: "1. Date procesate", items: ["nume și adresă de email pentru cont și verificare", "credite de autentificare, sesiuni și autentificare cu doi factori", "interval de disponibilitate, momentul programării și starea acesteia", "referință opacă la un eveniment de calendar"] },
    { title: "2. Date care nu sunt colectate", paragraphs: ["Nu solicitați și nu introduceți în aplicație note clinice, diagnostic, istoric medical, simptome sau alte date de sănătate. Formularul de programare nu are câmp de observații."] },
    { title: "3. Scopuri", paragraphs: ["Folosim datele pentru autentificare, prevenirea abuzului, afișarea disponibilității, gestionarea programării, confirmări/anulări și obligații legale aplicabile. Operatorul trebuie să confirme pentru fiecare scop temeiul juridic înainte de publicare."] },
    { title: "4. Furnizori", paragraphs: ["Baza D1 este configurată cu jurisdicție UE și fără replici de citire. Cloudflare procesează infrastructura; Google Calendar primește doar un eveniment generic, fără nume, email sau detalii despre terapie. Configurarea nu garantează procesare exclusiv în UE."] },
    { title: "5. Păstrare și ștergere", paragraphs: ["Conturile șterse sunt de-identificate și accesul este revocat imediat. Datele de programare sunt șterse conform perioadelor aprobate de operator/DPO și eventualelor obligații legale. Perioadele și excepțiile trebuie comunicate de operator."] },
    { title: "6. Drepturi și contact", paragraphs: ["Pentru acces, rectificare, ștergere, restricționare, portabilitate sau obiecții contactează operatorul. Procedura de verificare a identității, răspuns și plângeri trebuie validată juridic de operator."] },
  ],
}
enPages["politica-de-confidentialitate"] = {
  kind: "legal",
  title: "Privacy policy",
  description: "This application processes the minimum data for accounts and bookings; it is not a medical record.",
  sections: [
    { title: "1. Data processed", items: ["name and email address for the account and verification", "authentication credentials, sessions, and two-factor authentication", "availability window, appointment time, and status", "an opaque calendar-event reference"] },
    { title: "2. Data not collected", paragraphs: ["Do not submit clinical notes, diagnoses, medical history, symptoms, or other health information to the application. The booking form has no notes field."] },
    { title: "3. Purposes", paragraphs: ["We use data for authentication, abuse prevention, availability display, appointment management, confirmations/cancellations, and applicable legal obligations. The controller must validate the legal basis for every purpose before publication."] },
    { title: "4. Providers", paragraphs: ["D1 is configured with EU jurisdiction and no read replicas. Cloudflare operates infrastructure; Google Calendar receives only a generic event with no name, email, or therapy details. This configuration does not guarantee EU-only processing."] },
    { title: "5. Retention and deletion", paragraphs: ["Deleted accounts are de-identified and access is revoked immediately. Scheduling data is removed according to controller/DPO-approved periods and any legal obligations. The controller must communicate the actual periods and exceptions."] },
    { title: "6. Rights and contact", paragraphs: ["Contact the controller to exercise access, rectification, erasure, restriction, portability, or objection rights. The controller must legally validate its identity-verification, response, and complaint procedure."] },
  ],
}

// These overrides replace legacy CMS-imported cookie text that referenced
// Google Analytics and WordPress, neither of which is deployed by this app.
// Legal/controller review is still required before publishing any policy.
roPages["politica-de-cookies"] = {
  kind: "legal",
  title: "Politica de cookie-uri",
  description: "Aplicația folosește doar tehnologii necesare pentru securitate, autentificare și funcționare.",
  sections: [
    { title: "1. Ce folosim", paragraphs: ["Nu folosim Google Analytics, WordPress, publicitate comportamentală sau alte cookie-uri de analiză în această versiune a aplicației."] },
    { title: "2. Cookie-uri esențiale", paragraphs: ["Better Auth folosește cookie-uri HttpOnly, Secure în producție și SameSite=Lax pentru sesiune și, când este necesar, pentru fluxul de autentificare cu doi factori. Acestea nu sunt folosite pentru marketing."] },
    { title: "3. Protecție anti-abuz", paragraphs: ["Cloudflare Turnstile poate folosi tehnologii de securitate pentru a preveni automatizările abuzive. Cloudflare poate seta propriile cookie-uri tehnice conform documentației sale."] },
    { title: "4. Preferințe locale", paragraphs: ["Preferința de temă este păstrată în localStorage în browser, nu într-un cookie."] },
    { title: "5. Gestionare", paragraphs: ["Blocarea cookie-urilor esențiale poate împiedica autentificarea. Revizuirea juridică a acestei politici, a temeiului legal și a mecanismelor de consimțământ rămâne responsabilitatea operatorului."] },
  ],
  table: { headers: ["Tehnologie", "Tip", "Scop", "Durată"], rows: [["Cookie-uri Better Auth de sesiune / 2FA", "Esențial", "Autentificare și securitate cont", "Sesiune / conform configurării"], ["Cloudflare Turnstile", "Securitate", "Prevenire abuz", "Conform Cloudflare"], ["eikon-theme (localStorage)", "Preferință locală", "Temă vizuală", "Până la ștergere"]] },
}
enPages["politica-de-cookies"] = {
  kind: "legal",
  title: "Cookie policy",
  description: "The application uses only technology necessary for security, authentication, and operation.",
  sections: [
    { title: "1. What we use", paragraphs: ["This version of the application does not deploy Google Analytics, WordPress, behavioural advertising, or analytics cookies."] },
    { title: "2. Essential cookies", paragraphs: ["Better Auth uses HttpOnly cookies, Secure cookies in production, and SameSite=Lax for sessions and, where needed, the two-factor authentication flow. They are not used for marketing."] },
    { title: "3. Anti-abuse protection", paragraphs: ["Cloudflare Turnstile may use security technology to prevent abusive automation. Cloudflare may set its own technical cookies under its documentation."] },
    { title: "4. Local preference", paragraphs: ["The theme preference is stored in browser localStorage, not a cookie."] },
    { title: "5. Managing cookies", paragraphs: ["Blocking essential cookies can prevent sign-in. Legal review of this policy, the legal basis, and consent mechanisms remains the controller's responsibility."] },
  ],
  table: { headers: ["Technology", "Type", "Purpose", "Duration"], rows: [["Better Auth session / 2FA cookies", "Essential", "Account authentication and security", "Session / configured duration"], ["Cloudflare Turnstile", "Security", "Abuse prevention", "As set by Cloudflare"], ["eikon-theme (localStorage)", "Local preference", "Visual theme", "Until deleted"]] },
}

export const site: Record<Locale, LocaleSite> = {
  ro: {
    nav: { home: "Acasă", services: "Servicii", about: "Despre mine", scheduling: "Programare", contact: "Contact", login: "Autentificare", account: "Contul meu" },
    footer: { strapline: "Psihoterapie, consiliere și formare profesională în Iași și online.", explore: "Explorează", legal: "Informații legale", follow: "Urmărește Eikon Mind", copyright: "Toate drepturile rezervate." },
    home: roHome,
    pages: roPages,
  },
  en: {
    nav: { home: "Home", services: "Services", about: "About", scheduling: "Book", contact: "Contact", login: "Sign in", account: "My account" },
    footer: { strapline: "Psychotherapy, counselling, and professional training in Iași and online.", explore: "Explore", legal: "Legal information", follow: "Follow Eikon Mind", copyright: "All rights reserved." },
    home: enHome,
    pages: enPages,
  },
}

export function getPage(locale: Locale, slug: string) {
  return site[locale].pages[slug as PublicSlug]
}

export const locales = ["ro", "en"] as const
export type Locale = (typeof locales)[number]

export const site = {
  ro: {
    nav: { home: "Acasă", services: "Servicii", about: "Despre mine", scheduling: "Programare", contact: "Contact", login: "Autentificare", account: "Contul meu" },
    home: {
      eyebrow: "Psihoterapie & consiliere", title: "Eikon Mind", lead: "Un spațiu sigur pentru a te reconecta cu tine, cu cei dragi și cu ceea ce contează.", cta: "Programează o întâlnire",
      introTitle: "Fiecare schimbare începe cu o conversație.", intro: "Împreună putem înțelege mai bine emoțiile, relațiile și resursele de care ai nevoie pentru echilibru.",
      quote: "Nu trebuie să parcurgi drumul singur.",
    },
    pages: {
      adulti: ["Psihoterapie pentru adulți", "Un proces adaptat ritmului și nevoilor tale, pentru anxietate, stres, blocaje și momente de schimbare."],
      "copii-si-adolescenti": ["Copii și adolescenți", "Sprijin blând pentru copii, adolescenți și familiile lor, într-un cadru de încredere și siguranță."],
      familii: ["Terapie de cuplu și familie", "Relațiile pot deveni mai clare atunci când există spațiu pentru ascultare, dialog și reconectare."],
      seniori: ["Consiliere pentru seniori", "Un loc pentru poveștile, pierderile, adaptările și resursele acestei etape de viață."],
      adictii: ["Sprijin în adicții", "Un proces fără judecată, orientat spre înțelegere, recuperare și pași sustenabili."],
      "formare-profesionala": ["Formare profesională", "Ateliere și programe de dezvoltare pentru profesioniștii care lucrează cu oameni."],
      "despre-mine": ["Despre mine", "Sunt psihoterapeut și cred în puterea unei relații terapeutice autentice, construite cu răbdare și respect."],
      programare: ["Programare", "Alege o întâlnire potrivită pentru tine. Pentru rezervare vei fi direcționat către contul tău securizat."],
      contact: ["Contact", "Pentru întrebări sau pentru a afla mai multe, mă poți contacta direct la telefon sau prin e-mail."],
      "blog-page": ["Blog", "Un spațiu în pregătire pentru reflecții, resurse și idei care pot susține starea de bine."],
      "anpc-protectia-consumatorilor": ["ANPC — Protecția consumatorilor", "Informații privind protecția consumatorilor și soluționarea alternativă a litigiilor."],
      "politica-de-confidentialitate": ["Politica de confidențialitate", "Protejăm datele personale și le folosim numai pentru furnizarea serviciilor solicitate."],
      "politica-de-cookies": ["Politica de cookies", "Acest site folosește doar cookie-uri necesare funcționării și preferințelor de limbă și temă."],
      "termeni-si-conditii": ["Termeni și condiții", "Folosirea site-ului și a serviciilor este guvernată de acești termeni și condiții."],
    },
  },
  en: {
    nav: { home: "Home", services: "Services", about: "About", scheduling: "Book", contact: "Contact", login: "Sign in", account: "My account" },
    home: {
      eyebrow: "Psychotherapy & counselling", title: "Eikon Mind", lead: "A safe space to reconnect with yourself, your loved ones, and what matters.", cta: "Book a session",
      introTitle: "Every change starts with a conversation.", intro: "Together, we can better understand emotions, relationships, and the resources you need for balance.", quote: "You do not have to walk the path alone.",
    },
    pages: {
      adulti: ["Psychotherapy for adults", "A process tailored to your pace and needs, for anxiety, stress, blocks, and periods of change."],
      "copii-si-adolescenti": ["Children and teenagers", "Gentle support for children, teenagers, and their families in a trusted and safe setting."],
      familii: ["Couple and family therapy", "Relationships become clearer when there is room for listening, dialogue, and reconnection."],
      seniori: ["Counselling for seniors", "A place for the stories, losses, adaptations, and resources of this stage of life."],
      adictii: ["Support for addictions", "A non-judgmental process focused on understanding, recovery, and sustainable steps."],
      "formare-profesionala": ["Professional training", "Workshops and development programmes for professionals who work with people."],
      "despre-mine": ["About", "I am a psychotherapist and believe in the power of an authentic therapeutic relationship, built with patience and respect."],
      programare: ["Booking", "Choose a meeting that suits you. To make a reservation, you will be taken to your secure account."],
      contact: ["Contact", "For questions or to find out more, contact me directly by phone or e-mail."],
      "blog-page": ["Blog", "A space in preparation for reflections, resources, and ideas that support wellbeing."],
      "anpc-protectia-consumatorilor": ["Consumer protection", "Information on consumer protection and alternative dispute resolution."],
      "politica-de-confidentialitate": ["Privacy policy", "We protect personal data and use it only to provide the requested services."],
      "politica-de-cookies": ["Cookie policy", "This website uses only cookies needed for operation and language and theme preferences."],
      "termeni-si-conditii": ["Terms and conditions", "Use of this website and its services is governed by these terms and conditions."],
    },
  },
} as const

export const publicSlugs = ["adulti", "copii-si-adolescenti", "familii", "seniori", "adictii", "formare-profesionala", "despre-mine", "programare", "contact", "blog-page", "anpc-protectia-consumatorilor", "politica-de-confidentialitate", "politica-de-cookies", "termeni-si-conditii"] as const

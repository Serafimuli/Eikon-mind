export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"
export type TherapyMode = "individual" | "online" | "group"

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  service: string
  date: string
  time: string
  status: AppointmentStatus
  notes?: string
  therapist: string
  therapyMode: TherapyMode
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: "client" | "admin"
}

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    firstName: "Maria",
    lastName: "Ionescu",
    email: "client@example.com",
    password: "password",
    role: "client",
  },
  {
    id: "u2",
    firstName: "Admin",
    lastName: "Pop",
    email: "admin@example.com",
    password: "password",
    role: "admin",
  },
  {
    id: "u3",
    firstName: "Alexandru",
    lastName: "Dumitrescu",
    email: "alex@example.com",
    password: "password",
    role: "client",
  },
  {
    id: "u4",
    firstName: "Elena",
    lastName: "Constantin",
    email: "elena@example.com",
    password: "password",
    role: "client",
  },
]

const today = new Date()
const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r.toISOString().split("T")[0]
}

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    clientId: "u1",
    clientName: "Maria Ionescu",
    service: "Adults",
    date: addDays(today, 3),
    time: "10:00",
    status: "confirmed",
    therapist: "Maria-Manuela Niță",
    therapyMode: "individual",
    notes: "Continued work on anxiety management techniques.",
  },
  {
    id: "a2",
    clientId: "u1",
    clientName: "Maria Ionescu",
    service: "Adults",
    date: addDays(today, 17),
    time: "10:00",
    status: "pending",
    therapist: "Maria-Manuela Niță",
    therapyMode: "online",
  },
  {
    id: "a3",
    clientId: "u1",
    clientName: "Maria Ionescu",
    service: "Adults",
    date: addDays(today, -14),
    time: "10:00",
    status: "completed",
    therapist: "Maria-Manuela Niță",
    therapyMode: "individual",
    notes: "Initial consultation.",
  },
  {
    id: "a4",
    clientId: "u1",
    clientName: "Maria Ionescu",
    service: "Adults",
    date: addDays(today, -28),
    time: "14:00",
    status: "completed",
    therapist: "Maria-Manuela Niță",
    therapyMode: "individual",
  },
  {
    id: "a5",
    clientId: "u3",
    clientName: "Alexandru Dumitrescu",
    service: "Adults",
    date: addDays(today, 1),
    time: "09:00",
    status: "confirmed",
    therapist: "Maria-Manuela Niță",
    therapyMode: "online",
  },
  {
    id: "a6",
    clientId: "u3",
    clientName: "Alexandru Dumitrescu",
    service: "Professional Formation",
    date: addDays(today, 8),
    time: "15:30",
    status: "pending",
    therapist: "Maria-Manuela Niță",
    therapyMode: "group",
  },
  {
    id: "a7",
    clientId: "u4",
    clientName: "Elena Constantin",
    service: "Children & Adolescents",
    date: addDays(today, 2),
    time: "12:00",
    status: "confirmed",
    therapist: "Maria-Manuela Niță",
    therapyMode: "individual",
  },
  {
    id: "a8",
    clientId: "u4",
    clientName: "Elena Constantin",
    service: "Children & Adolescents",
    date: addDays(today, -7),
    time: "12:00",
    status: "completed",
    therapist: "Maria-Manuela Niță",
    therapyMode: "individual",
  },
  {
    id: "a9",
    clientId: "u3",
    clientName: "Alexandru Dumitrescu",
    service: "Families",
    date: addDays(today, -10),
    time: "17:00",
    status: "cancelled",
    therapist: "Maria-Manuela Niță",
    therapyMode: "group",
  },
]

export const TIME_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"]

export const SERVICES_EN = [
  "Adults",
  "Children & Adolescents",
  "Families",
  "Seniors",
  "Addictions",
  "Professional Formation",
]
export const SERVICES_RO = [
  "Adulți",
  "Copii și adolescenți",
  "Familii",
  "Seniori",
  "Adicții",
  "Formare profesională",
]

export const getServiceLabel = (service: string, lang: "en" | "ro") => {
  if (lang === "en") return service
  const index = SERVICES_EN.indexOf(service)
  return index >= 0 ? SERVICES_RO[index] : service
}

export interface ServiceCatalogItem {
  id: string
  image: string
}

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  { id: "adults", image: "/assets/service-adults.jpg" },
  {
    id: "kids-teens",
    image: "/assets/service-children-adolescents.jpg",
  },
  { id: "families", image: "/assets/service-families.jpg" },
  { id: "older-adults", image: "/assets/service-seniors.jpg" },
  { id: "addictions", image: "/assets/service-addictions.jpg" },
  {
    id: "professional-formation",
    image: "/assets/service-professional-formation.jpg",
  },
]

export const SERVICE_DETAIL_EN = [
  {
    id: "adults",
    title: "Adults",
    heading: "Clinical psychological assessment and psychodiagnosis",
    sub: "Understanding emotional, cognitive, behavioural, and personality functioning, together with the factors that support adaptation and change.",
    reasons: [
      "Assessment of emotional, cognitive, and behavioural functioning",
      "Assessment of personality and patterns of functioning",
      "Assessment of psychological symptoms",
      "Understanding adaptation difficulties and vulnerability factors",
      "Identifying personal resources and protective factors",
      "Clinical formulation and intervention recommendations",
    ],
    howHelps:
      "Cognitive-behavioural psychotherapy supports anxiety, depression, stress and adaptation, burnout, relationships, trauma, loss, life transitions, and personal development.",
    involves:
      "The process is collaborative and personalized, with careful assessment, a clear formulation, and recommendations adapted to your needs and goals.",
    icon: "🌿",
  },
  {
    id: "kids-teens",
    title: "Children & Adolescents",
    heading: "Psychological and developmental assessment",
    sub: "Assessment and psychological intervention adapted to age, development, emotional life, relationships, and family context.",
    reasons: [
      "Emotional and behavioural development",
      "Anxiety, fears, worries, and panic",
      "Emotional regulation, anger, and frustration tolerance",
      "Behavioural and school adaptation difficulties",
      "Social skills, communication, and relationships",
      "Self-esteem, resilience, and personal development",
      "Difficult events, loss, separation, and trauma",
      "Cognitive stimulation, attention, learning, and executive functions",
      "Parent counselling and family support",
    ],
    howHelps:
      "Support is adapted to the child's developmental stage and includes the individual and family resources that can make change safer and more sustainable.",
    involves:
      "The work may include psychological assessment, age-appropriate intervention, parental guidance, and recommendations for home, school, and family contexts.",
    icon: "🌱",
  },
  {
    id: "families",
    title: "Families",
    heading: "Interventions for the family system",
    sub: "Understanding, connection, and balance in the relationships that matter most.",
    reasons: [
      "Improving communication",
      "Managing conflicts",
      "Adapting to family changes",
      "Strengthening relationships and cooperation within the family",
    ],
    howHelps:
      "Family work creates space for each person's perspective to be heard and for healthier patterns of communication and cooperation to develop.",
    involves:
      "The process is collaborative, confidential, and focused on the relationships, changes, and shared objectives that bring the family to therapy.",
    icon: "✦",
  },
  {
    id: "older-adults",
    title: "Seniors",
    heading: "Psychological assessment and support",
    sub: "Support for adaptation, meaning, and quality of life at every stage of later life.",
    reasons: [
      "Adapting to changes associated with ageing",
      "Managing loss and grief",
      "Support in the face of chronic illness",
      "Adapting to changes in family and social roles",
      "Maintaining emotional balance and quality of life",
    ],
    howHelps:
      "The work offers a respectful space to understand change, process loss, and reconnect with resources, meaning, and personal direction.",
    involves:
      "The pace and focus are adapted to each person's circumstances, needs, relationships, and goals for emotional balance and quality of life.",
    icon: "☽",
  },
  {
    id: "addictions",
    title: "Addictions",
    heading: "Specialized assessment and counselling",
    sub: "Support for understanding addiction, building motivation, recovering, and protecting long-term change.",
    reasons: [
      "Problematic alcohol use",
      "Psychoactive substance use",
      "Abusive medication use",
      "Gambling",
      "Behavioural addictions and problematic technology use",
      "Recovery and relapse prevention",
      "Family and carer interventions",
    ],
    howHelps:
      "The process can support motivation for change, craving management, risk-factor identification, relapse prevention, and maintaining change over time.",
    involves:
      "Support may include psychoeducation, healthy boundary-setting, understanding addiction mechanisms, and strengthening the recovery process for clients and families.",
    icon: "◇",
  },
  {
    id: "professional-formation",
    title: "Professional Formation",
    heading: "Areas of professional expertise",
    sub: "Professional training and development grounded in rigour, reflection, and applicability in real-world work contexts.",
    reasons: [
      "Burnout and occupational health",
      "Anger and conflict management",
      "Violence prevention",
      "Substance use and addiction prevention",
      "Professional skills development",
      "Mental health and psychoeducation",
      "Resilience and adaptation",
      "Communication and relationships",
    ],
    howHelps:
      "Training and development connect scientific knowledge with reflection and practical application in the contexts where professionals work.",
    involves:
      "The focus is adapted to the professional context, learning objectives, current challenges, and resources of the people or teams involved.",
    icon: "⬡",
  },
]

export const SERVICE_DETAIL_RO = [
  {
    id: "adults",
    title: "Adulți",
    heading: "Evaluare psihologică clinică și psihodiagnostic",
    sub: "Înțelegerea funcționării emoționale, cognitive, comportamentale și a personalității, împreună cu factorii care susțin adaptarea și schimbarea.",
    reasons: [
      "Evaluarea funcționării emoționale, cognitive și comportamentale",
      "Evaluarea personalității și a tiparelor de funcționare",
      "Evaluarea simptomatologiei psihologice",
      "Înțelegerea dificultăților de adaptare și a factorilor de vulnerabilitate",
      "Identificarea resurselor personale și a factorilor de protecție",
      "Formulare clinică și recomandări pentru intervenție",
    ],
    howHelps:
      "Psihoterapia cognitiv-comportamentală oferă sprijin pentru anxietate, depresie, stres și adaptare, burnout, relații, traumă, pierdere, tranziții de viață și dezvoltare personală.",
    involves:
      "Procesul este colaborativ și personalizat, cu evaluare atentă, formulare clinică și recomandări adaptate nevoilor și obiectivelor tale.",
    icon: "🌿",
  },
  {
    id: "kids-teens",
    title: "Copii și adolescenți",
    heading: "Evaluare psihologică și a dezvoltării",
    sub: "Evaluare și intervenție psihologică adaptate vârstei, dezvoltării, lumii emoționale, relațiilor și contextului familial.",
    reasons: [
      "Dezvoltare emoțională și comportamentală",
      "Anxietate, frici, îngrijorări și atacuri de panică",
      "Reglare emoțională, furie și toleranță la frustrare",
      "Dificultăți comportamentale și de adaptare școlară",
      "Competențe sociale, comunicare și relaționare",
      "Stimă de sine, reziliență și dezvoltare personală",
      "Evenimente dificile, pierderi, separare și traumă",
      "Stimulare cognitivă, atenție, învățare și funcții executive",
      "Consiliere parentală și sprijin familial",
    ],
    howHelps:
      "Sprijinul este adaptat etapei de dezvoltare a copilului și include resursele individuale și familiale care pot face schimbarea mai sigură și mai durabilă.",
    involves:
      "Procesul poate include evaluare psihologică, intervenție adaptată vârstei, ghidare parentală și recomandări pentru acasă, școală și familie.",
    icon: "🌱",
  },
  {
    id: "families",
    title: "Familii",
    heading: "Intervenții pentru sistemul familial",
    sub: "Înțelegere, conectare și echilibru în relațiile care contează cel mai mult.",
    reasons: [
      "Îmbunătățirea comunicării",
      "Gestionarea conflictelor",
      "Adaptarea la schimbări familiale",
      "Consolidarea relațiilor și a cooperării în familie",
    ],
    howHelps:
      "Lucrul cu familia creează spațiu pentru ca perspectiva fiecărei persoane să fie auzită și pentru dezvoltarea unor tipare mai sănătoase de comunicare și cooperare.",
    involves:
      "Procesul este colaborativ, confidențial și axat pe relațiile, schimbările și obiectivele comune care aduc familia în terapie.",
    icon: "✦",
  },
  {
    id: "older-adults",
    title: "Seniori",
    heading: "Evaluare și suport psihologic",
    sub: "Sprijin pentru adaptare, sens și calitate a vieții în fiecare etapă a maturității.",
    reasons: [
      "Adaptarea la schimbările asociate înaintării în vârstă",
      "Gestionarea pierderilor și a procesului de doliu",
      "Sprijin în fața bolii cronice",
      "Adaptarea la modificările rolurilor familiale și sociale",
      "Menținerea echilibrului emoțional și a calității vieții",
    ],
    howHelps:
      "Procesul oferă un spațiu respectuos pentru înțelegerea schimbării, procesarea pierderii și reconectarea cu resursele, sensul și direcția personală.",
    involves:
      "Ritmul și focusul sunt adaptate circumstanțelor, nevoilor, relațiilor și obiectivelor fiecărei persoane pentru echilibru emoțional și calitatea vieții.",
    icon: "☽",
  },
  {
    id: "addictions",
    title: "Adicții",
    heading: "Evaluare și consiliere specializată",
    sub: "Sprijin pentru înțelegerea adicției, dezvoltarea motivației, recuperare și protejarea schimbării pe termen lung.",
    reasons: [
      "Consum problematic de alcool",
      "Consum de substanțe psihoactive",
      "Utilizarea abuzivă a medicamentelor",
      "Jocuri de noroc",
      "Dependențe comportamentale și utilizarea problematică a tehnologiei",
      "Recuperare și prevenirea recăderilor",
      "Intervenții pentru familie și aparținători",
    ],
    howHelps:
      "Procesul poate susține dezvoltarea motivației pentru schimbare, managementul cravingului, identificarea factorilor de risc, prevenirea recăderilor și menținerea schimbării.",
    involves:
      "Sprijinul poate include psihoeducație, stabilirea limitelor sănătoase, înțelegerea mecanismelor dependenței și susținerea procesului de recuperare pentru clienți și familii.",
    icon: "◇",
  },
  {
    id: "professional-formation",
    title: "Formare profesională",
    heading: "Arii de expertiză profesională",
    sub: "Formare și dezvoltare profesională construite pe rigoare, reflecție și aplicabilitate în contexte reale de lucru.",
    reasons: [
      "Burnout și sănătate ocupațională",
      "Managementul furiei și al conflictelor",
      "Prevenirea violenței",
      "Prevenirea consumului de substanțe și a dependențelor",
      "Dezvoltarea competențelor profesionale",
      "Sănătate mintală și psihoeducație",
      "Reziliență și adaptare",
      "Comunicare și relaționare",
    ],
    howHelps:
      "Formarea și dezvoltarea leagă cunoașterea științifică de reflecție și aplicabilitate practică în contextele în care lucrează profesioniștii.",
    involves:
      "Focusul este adaptat contextului profesional, obiectivelor de învățare, provocărilor actuale și resurselor persoanelor sau echipelor implicate.",
    icon: "⬡",
  },
]

export const THERAPY_TYPES_EN = [
  {
    id: "evidence-based",
    name: "Evidence-based psychotherapy",
    short:
      "Cognitive-behavioural psychotherapy grounded in scientific evidence.",
    description:
      "The work combines the rigour of clinical psychology and cognitive-behavioural psychotherapy with a human, collaborative, and personalized approach.",
    goals:
      "Understand what you are experiencing, build practical resources, and create authentic and lasting change.",
    howItWorks:
      "The process begins with careful understanding and develops around your needs, values, objectives, and the therapeutic relationship.",
    suitableFor:
      "Anxiety, depression, stress, relationships, trauma, loss, life transitions, personal development",
  },
  {
    id: "clinical-assessment",
    name: "Clinical assessment & psychodiagnosis",
    short:
      "Understanding emotional, cognitive, behavioural, and personality functioning.",
    description:
      "Clinical assessment helps clarify symptoms, adaptation difficulties, vulnerability factors, and personal resources so that recommendations can be grounded in a clear clinical formulation.",
    goals:
      "Clarify the difficulties you are facing and identify resources and directions for intervention.",
    howItWorks:
      "Assessment explores relevant emotional, cognitive, behavioural, and relational information before formulating recommendations.",
    suitableFor:
      "Psychological symptoms, adaptation difficulties, clinical clarification, intervention planning",
  },
  {
    id: "addiction-counselling",
    name: "Specialized addiction counselling",
    short:
      "Support for motivation, recovery, craving management, and relapse prevention.",
    description:
      "Addiction counselling can include psychoeducation, understanding the mechanisms of addiction, healthy boundaries, risk-factor identification, and support for the recovery process.",
    goals:
      "Develop motivation for change, prevent relapse, and support long-term recovery for clients and families.",
    howItWorks:
      "The process is adapted to the type of addiction, current resources, risk factors, family context, and recovery goals.",
    suitableFor:
      "Alcohol, psychoactive substances, medication misuse, gambling, technology, behavioural addictions",
  },
  {
    id: "personalized-approach",
    name: "A human, personalized approach",
    short: "Care adapted to each person's story, needs, values, and goals.",
    description:
      "There are no universal solutions or interventions applied mechanically. The process respects each person's uniqueness and is built on safety, confidentiality, respect, and collaboration.",
    goals:
      "Create clarity, reconnection, and authentic evolution in a way that reflects your own values.",
    howItWorks:
      "Before technique comes safety; before answers comes understanding of the questions that truly matter to you.",
    suitableFor:
      "Children, adolescents, adults, families, seniors, people facing addictions, and professionals",
  },
]

export const THERAPY_TYPES_RO = [
  {
    id: "evidence-based",
    name: "Psihoterapie bazată pe dovezi științifice",
    short:
      "Psihoterapie cognitiv-comportamentală fundamentată pe dovezi științifice.",
    description:
      "Practica îmbină rigoarea psihologiei clinice și a psihoterapiei cognitiv-comportamentale cu o abordare umană, colaborativă și personalizată.",
    goals:
      "Înțelegerea a ceea ce trăiești, dezvoltarea resurselor practice și construirea unei schimbări autentice și durabile.",
    howItWorks:
      "Procesul începe cu înțelegere atentă și se construiește în jurul nevoilor, valorilor, obiectivelor tale și relației terapeutice.",
    suitableFor:
      "Anxietate, depresie, stres, relații, traumă, pierdere, tranziții de viață, dezvoltare personală",
  },
  {
    id: "clinical-assessment",
    name: "Evaluare clinică și psihodiagnostic",
    short:
      "Înțelegerea funcționării emoționale, cognitive, comportamentale și a personalității.",
    description:
      "Evaluarea clinică ajută la clarificarea simptomelor, dificultăților de adaptare, factorilor de vulnerabilitate și resurselor personale, astfel încât recomandările să se bazeze pe o formulare clinică clară.",
    goals:
      "Clarificarea dificultăților cu care te confrunți și identificarea resurselor și direcțiilor de intervenție.",
    howItWorks:
      "Evaluarea explorează informații relevante emoționale, cognitive, comportamentale și relaționale înaintea formulării recomandărilor.",
    suitableFor:
      "Simptomatologie psihologică, dificultăți de adaptare, clarificare clinică, planificarea intervenției",
  },
  {
    id: "addiction-counselling",
    name: "Consiliere specializată în adicții",
    short:
      "Sprijin pentru motivație, recuperare, gestionarea cravingului și prevenirea recăderilor.",
    description:
      "Consilierea în adicții poate include psihoeducație, înțelegerea mecanismelor dependenței, limite sănătoase, identificarea factorilor de risc și susținerea procesului de recuperare.",
    goals:
      "Dezvoltarea motivației pentru schimbare, prevenirea recăderilor și susținerea recuperării pe termen lung pentru clienți și familii.",
    howItWorks:
      "Procesul este adaptat tipului de adicție, resurselor actuale, factorilor de risc, contextului familial și obiectivelor de recuperare.",
    suitableFor:
      "Alcool, substanțe psihoactive, utilizarea abuzivă a medicamentelor, jocuri de noroc, tehnologie, dependențe comportamentale",
  },
  {
    id: "personalized-approach",
    name: "Abordare umană, adaptată unicității tale",
    short:
      "Îngrijire adaptată poveștii, nevoilor, valorilor și obiectivelor fiecărei persoane.",
    description:
      "Nu cred în soluții universale și nici în intervenții aplicate mecanic. Procesul respectă unicitatea fiecărei persoane și se construiește pe siguranță, confidențialitate, respect și colaborare.",
    goals:
      "Claritate, reconectare și evoluție autentică, într-un mod care reflectă propriile tale valori.",
    howItWorks:
      "Înainte de tehnică construiesc siguranță; înainte de răspunsuri explorez întrebările care contează cu adevărat pentru tine.",
    suitableFor:
      "Copii, adolescenți, adulți, familii, seniori, persoane care se confruntă cu adicții și profesioniști",
  },
]

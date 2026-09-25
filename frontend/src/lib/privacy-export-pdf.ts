import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PageSizes, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { appointmentServiceLabel } from "@/lib/appointment-types";
import { appointmentStatusLabel, formatDateTime, formatTime } from "@/lib/presentation";
import type { PortableExportData } from "@/lib/privacy-export";
import type { Locale } from "@/lib/site-content";

export type PersonalDataExportPdfAssets = {
  logo: Uint8Array;
  displayFont: Uint8Array;
  bodyFont: Uint8Array;
  bodyMediumFont: Uint8Array;
};

type ExportCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  generated: string;
  account: string;
  name: string;
  email: string;
  emailVerified: string;
  verified: string;
  notVerified: string;
  signInMethods: string;
  noSignInMethods: string;
  appointments: string;
  dateTime: string;
  ends: string;
  serviceType: string;
  status: string;
  cancelledOn: string;
  noAppointments: string;
  privacyNote: string;
  footer: string;
  page: string;
  otherProvider: string;
  providerLabels: Record<string, string>;
  documentTitle: string;
  documentSubject: string;
};

export const privacyExportCopy: Record<Locale, ExportCopy> = {
  en: {
    eyebrow: "GDPR PERSONAL DATA EXPORT",
    title: "Personal data export",
    intro: "A readable summary of the personal data stored in your Eikon Mind account.",
    generated: "Generated",
    account: "Account",
    name: "Name",
    email: "Email",
    emailVerified: "Email verified",
    verified: "Verified",
    notVerified: "Not verified",
    signInMethods: "Sign-in methods",
    noSignInMethods: "No linked sign-in methods",
    appointments: "Appointments",
    dateTime: "Date and time",
    ends: "Ends",
    serviceType: "Service type",
    status: "Status",
    cancelledOn: "Cancelled on",
    noAppointments: "No appointments recorded.",
    privacyNote:
      "This summary includes only account and scheduling data stored by Eikon Mind. It does not include therapy notes or clinical documents.",
    footer: "Eikon Mind - eikon-mind.ro",
    page: "Page",
    otherProvider: "Other sign-in method",
    providerLabels: {
      credential: "Email and password",
      google: "Google",
    },
    documentTitle: "Eikon Mind - Personal data export",
    documentSubject: "Personal data export summary",
  },
  ro: {
    eyebrow: "EXPORT GDPR DE DATE PERSONALE",
    title: "Export de date personale",
    intro: "Un rezumat ușor de citit al datelor personale stocate în contul tău Eikon Mind.",
    generated: "Generat la",
    account: "Cont",
    name: "Nume",
    email: "Email",
    emailVerified: "Email verificat",
    verified: "Verificat",
    notVerified: "Neverificat",
    signInMethods: "Metode de autentificare",
    noSignInMethods: "Nu există metode de autentificare asociate",
    appointments: "Programări",
    dateTime: "Data și ora",
    ends: "Se termină",
    serviceType: "Tipul serviciului",
    status: "Stare",
    cancelledOn: "Anulată la",
    noAppointments: "Nu există programări înregistrate.",
    privacyNote:
      "Acest rezumat include doar datele de cont și de programare stocate de Eikon Mind. Nu include note de terapie sau documente clinice.",
    footer: "Eikon Mind - eikon-mind.ro",
    page: "Pagina",
    otherProvider: "Altă metodă de autentificare",
    providerLabels: {
      credential: "Email și parolă",
      google: "Google",
    },
    documentTitle: "Eikon Mind - Export de date personale",
    documentSubject: "Rezumat al exportului de date personale",
  },
};

export function getPrivacyExportCopy(locale: Locale) {
  return privacyExportCopy[locale];
}

const PAGE_WIDTH = PageSizes.A4[0];
const PAGE_HEIGHT = PageSizes.A4[1];
const MARGIN_X = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const CONTENT_BOTTOM = 64;
const CARD_PADDING = 16;
const BODY_SIZE = 10;
const BODY_LINE_HEIGHT = 14;

const COLORS = {
  primary: rgb(159 / 255, 77 / 255, 50 / 255),
  ink: rgb(20 / 255, 20 / 255, 19 / 255),
  body: rgb(61 / 255, 61 / 255, 58 / 255),
  muted: rgb(100 / 255, 98 / 255, 93 / 255),
  hairline: rgb(230 / 255, 223 / 255, 216 / 255),
  canvas: rgb(250 / 255, 249 / 255, 245 / 255),
  surfaceSoft: rgb(245 / 255, 240 / 255, 232 / 255),
  surfaceCard: rgb(239 / 255, 233 / 255, 222 / 255),
  surfaceStrong: rgb(232 / 255, 224 / 255, 210 / 255),
};

type KeyValueRow = { label: string; value: string };

function cleanText(value: string) {
  return (
    value
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .replace(/[\r\n\t]+/g, " ")
      .trim() || "-"
  );
}

function splitLongWord(word: string, font: PDFFont, size: number, maxWidth: number) {
  const chunks: string[] = [];
  let current = "";
  for (const character of word) {
    const candidate = `${current}${character}`;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      chunks.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = cleanText(value).split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const chunks =
      font.widthOfTextAtSize(word, size) > maxWidth
        ? splitLongWord(word, font, size, maxWidth)
        : [word];
    for (const chunk of chunks) {
      const candidate = current ? `${current} ${chunk}` : chunk;
      if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(current);
        current = chunk;
      } else {
        current = candidate;
      }
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
}

function drawWrappedText(
  page: PDFPage,
  value: string,
  x: number,
  top: number,
  width: number,
  font: PDFFont,
  size: number,
  color = COLORS.body,
  lineHeight = size * 1.35,
) {
  const lines = wrapText(value, font, size, width);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: top - size - index * lineHeight,
      font,
      size,
      color,
    });
  });
  return lines.length * lineHeight;
}

function drawHeader(page: PDFPage, logo: PDFImage, bodyMediumFont: PDFFont, copy: ExportCopy) {
  const headerY = PAGE_HEIGHT - 58;
  page.drawImage(logo, { x: MARGIN_X, y: PAGE_HEIGHT - 76, width: 30, height: 30 });

  const eikonWidth = bodyMediumFont.widthOfTextAtSize("Eikon", 13);
  page.drawText("Eikon", {
    x: MARGIN_X + 40,
    y: headerY,
    font: bodyMediumFont,
    size: 13,
    color: COLORS.ink,
  });
  page.drawText("Mind", {
    x: MARGIN_X + 40 + eikonWidth + 4,
    y: headerY,
    font: bodyMediumFont,
    size: 13,
    color: COLORS.primary,
  });

  const eyebrowSize = 7.5;
  const eyebrowWidth = bodyMediumFont.widthOfTextAtSize(copy.eyebrow, eyebrowSize);
  page.drawText(copy.eyebrow, {
    x: PAGE_WIDTH - MARGIN_X - eyebrowWidth,
    y: headerY + 2,
    font: bodyMediumFont,
    size: eyebrowSize,
    color: COLORS.primary,
  });
  page.drawLine({
    start: { x: MARGIN_X, y: PAGE_HEIGHT - 91 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: PAGE_HEIGHT - 91 },
    thickness: 1,
    color: COLORS.hairline,
  });

  return PAGE_HEIGHT - 121;
}

function drawSectionHeading(page: PDFPage, title: string, top: number, displayFont: PDFFont) {
  const baseline = top - 18;
  page.drawRectangle({
    x: MARGIN_X,
    y: baseline + 5,
    width: 22,
    height: 2,
    color: COLORS.primary,
  });
  page.drawText(title, {
    x: MARGIN_X + 32,
    y: baseline,
    font: displayFont,
    size: 17,
    color: COLORS.ink,
  });
  return top - 34;
}

function keyValueMetrics(rows: KeyValueRow[], bodyFont: PDFFont, bodyMediumFont: PDFFont) {
  const labelWidth = 132;
  const valueWidth = CONTENT_WIDTH - CARD_PADDING * 2 - labelWidth - 16;
  const rowHeights = rows.map((row) => {
    const labelLines = wrapText(row.label, bodyMediumFont, 8.5, labelWidth);
    const valueLines = wrapText(row.value, bodyFont, BODY_SIZE, valueWidth);
    return Math.max(labelLines.length * 12, valueLines.length * BODY_LINE_HEIGHT) + 8;
  });
  return {
    labelWidth,
    valueWidth,
    rowHeights,
    height: CARD_PADDING * 2 + rowHeights.reduce((a, b) => a + b, 0),
  };
}

function drawKeyValueCard(
  page: PDFPage,
  rows: KeyValueRow[],
  top: number,
  bodyFont: PDFFont,
  bodyMediumFont: PDFFont,
) {
  const metrics = keyValueMetrics(rows, bodyFont, bodyMediumFont);
  page.drawRectangle({
    x: MARGIN_X,
    y: top - metrics.height,
    width: CONTENT_WIDTH,
    height: metrics.height,
    color: COLORS.surfaceCard,
    borderColor: COLORS.hairline,
    borderWidth: 1,
  });

  let rowTop = top - CARD_PADDING;
  rows.forEach((row, index) => {
    drawWrappedText(
      page,
      row.label,
      MARGIN_X + CARD_PADDING,
      rowTop,
      metrics.labelWidth,
      bodyMediumFont,
      8.5,
      COLORS.muted,
      12,
    );
    drawWrappedText(
      page,
      row.value,
      MARGIN_X + CARD_PADDING + metrics.labelWidth + 16,
      rowTop,
      metrics.valueWidth,
      bodyFont,
      BODY_SIZE,
      COLORS.body,
      BODY_LINE_HEIGHT,
    );
    rowTop -= metrics.rowHeights[index];
  });

  return top - metrics.height;
}

function providerLabel(provider: string, copy: ExportCopy) {
  return copy.providerLabels[provider.toLowerCase()] ?? copy.otherProvider;
}

function providerCardHeight(providerLabels: string[], bodyFont: PDFFont) {
  const lines = providerLabels.map((provider) =>
    wrapText(provider, bodyFont, BODY_SIZE, CONTENT_WIDTH - 52),
  );
  return (
    CARD_PADDING * 2 +
    Math.max(
      1,
      lines.reduce((sum, value) => sum + value.length, 0),
    ) *
      18
  );
}

function drawProviderCard(
  page: PDFPage,
  providerLabels: string[],
  top: number,
  bodyFont: PDFFont,
  copy: ExportCopy,
) {
  const values = providerLabels.length ? providerLabels : [copy.noSignInMethods];
  const height = providerCardHeight(values, bodyFont);
  page.drawRectangle({
    x: MARGIN_X,
    y: top - height,
    width: CONTENT_WIDTH,
    height,
    color: COLORS.surfaceSoft,
    borderColor: COLORS.hairline,
    borderWidth: 1,
  });

  let rowTop = top - CARD_PADDING;
  values.forEach((value) => {
    page.drawCircle({
      x: MARGIN_X + CARD_PADDING + 3,
      y: rowTop - 7,
      size: 2.5,
      color: COLORS.primary,
    });
    const used = drawWrappedText(
      page,
      value,
      MARGIN_X + CARD_PADDING + 16,
      rowTop,
      CONTENT_WIDTH - CARD_PADDING * 2 - 16,
      bodyFont,
      BODY_SIZE,
      COLORS.body,
      BODY_LINE_HEIGHT,
    );
    rowTop -= Math.max(18, used + 4);
  });

  return top - height;
}

function tableRowValues(appointment: PortableExportData["appointments"][number], locale: Locale) {
  return [
    formatDateTime(appointment.startsAt, locale),
    formatTime(appointment.endsAt, locale),
    appointmentServiceLabel(appointment.serviceCode, locale),
    appointmentStatusLabel(appointment.status, locale),
    appointment.cancelledAt ? formatDateTime(appointment.cancelledAt, locale) : "-",
  ].map(cleanText);
}

const TABLE_COLUMNS = [
  { key: "dateTime", width: 140 },
  { key: "ends", width: 55 },
  { key: "serviceType", width: 100 },
  { key: "status", width: 75 },
  { key: "cancelledOn", width: CONTENT_WIDTH - 140 - 55 - 100 - 75 },
] as const;

function tableRowHeight(values: string[], bodyFont: PDFFont) {
  const lineCounts = values.map(
    (value, index) => wrapText(value, bodyFont, 8.5, TABLE_COLUMNS[index].width - 14).length,
  );
  return Math.max(31, Math.max(...lineCounts) * 11.5 + 14);
}

function drawTableHeader(page: PDFPage, top: number, bodyMediumFont: PDFFont, copy: ExportCopy) {
  const height = 29;
  page.drawRectangle({
    x: MARGIN_X,
    y: top - height,
    width: CONTENT_WIDTH,
    height,
    color: COLORS.surfaceStrong,
  });
  const labels = [copy.dateTime, copy.ends, copy.serviceType, copy.status, copy.cancelledOn];
  let x = MARGIN_X;
  labels.forEach((label, index) => {
    drawWrappedText(
      page,
      label,
      x + 7,
      top - 7,
      TABLE_COLUMNS[index].width - 14,
      bodyMediumFont,
      8,
      COLORS.ink,
      10,
    );
    x += TABLE_COLUMNS[index].width;
  });
  return top - height;
}

function drawTableRow(
  page: PDFPage,
  values: string[],
  top: number,
  height: number,
  index: number,
  bodyFont: PDFFont,
  bodyMediumFont: PDFFont,
) {
  page.drawRectangle({
    x: MARGIN_X,
    y: top - height,
    width: CONTENT_WIDTH,
    height,
    color: index % 2 === 0 ? COLORS.canvas : COLORS.surfaceSoft,
    borderColor: COLORS.hairline,
    borderWidth: 0.6,
  });
  let x = MARGIN_X;
  values.forEach((value, columnIndex) => {
    drawWrappedText(
      page,
      value,
      x + 7,
      top - 8,
      TABLE_COLUMNS[columnIndex].width - 14,
      columnIndex === 2 || columnIndex === 3 ? bodyMediumFont : bodyFont,
      8.5,
      COLORS.body,
      11.5,
    );
    x += TABLE_COLUMNS[columnIndex].width;
  });
  return top - height;
}

function drawPrivacyNote(page: PDFPage, text: string, top: number, bodyFont: PDFFont) {
  const textX = MARGIN_X + CARD_PADDING + 10;
  const textTop = top - CARD_PADDING;
  const textWidth = CONTENT_WIDTH - CARD_PADDING * 2 - 10;
  const textSize = 8.5;
  const textLineHeight = 12;
  const textHeight = wrapText(text, bodyFont, textSize, textWidth).length * textLineHeight;
  const height = textHeight + CARD_PADDING * 2;
  page.drawRectangle({
    x: MARGIN_X,
    y: top - height,
    width: CONTENT_WIDTH,
    height,
    color: COLORS.surfaceSoft,
    borderColor: COLORS.hairline,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: top - height,
    width: 3,
    height,
    color: COLORS.primary,
  });
  drawWrappedText(
    page,
    text,
    textX,
    textTop,
    textWidth,
    bodyFont,
    textSize,
    COLORS.body,
    textLineHeight,
  );
  return top - height;
}

function drawFooter(
  page: PDFPage,
  pageNumber: number,
  totalPages: number,
  bodyFont: PDFFont,
  copy: ExportCopy,
) {
  page.drawLine({
    start: { x: MARGIN_X, y: 43 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: 43 },
    thickness: 1,
    color: COLORS.hairline,
  });
  page.drawText(copy.footer, {
    x: MARGIN_X,
    y: 27,
    font: bodyFont,
    size: 8,
    color: COLORS.muted,
  });
  const pageLabel = `${copy.page} ${pageNumber} / ${totalPages}`;
  const pageLabelWidth = bodyFont.widthOfTextAtSize(pageLabel, 8);
  page.drawText(pageLabel, {
    x: PAGE_WIDTH - MARGIN_X - pageLabelWidth,
    y: 27,
    font: bodyFont,
    size: 8,
    color: COLORS.muted,
  });
}

export async function createPersonalDataExportPdf(
  data: PortableExportData,
  locale: Locale,
  assets: PersonalDataExportPdfAssets,
) {
  const copy = getPrivacyExportCopy(locale);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const [displayFont, bodyFont, bodyMediumFont, logo] = await Promise.all([
    pdf.embedFont(assets.displayFont, { subset: true }),
    pdf.embedFont(assets.bodyFont, { subset: true }),
    pdf.embedFont(assets.bodyMediumFont, { subset: true }),
    pdf.embedPng(assets.logo),
  ]);

  pdf.setTitle(copy.documentTitle);
  pdf.setAuthor("Eikon Mind");
  pdf.setSubject(copy.documentSubject);
  pdf.setCreator("Eikon Mind");
  pdf.setCreationDate(data.exportedAt);
  pdf.setModificationDate(data.exportedAt);

  const pages: PDFPage[] = [];
  const newPage = () => {
    const page = pdf.addPage(PageSizes.A4);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      color: COLORS.canvas,
    });
    const top = drawHeader(page, logo, bodyMediumFont, copy);
    pages.push(page);
    return { page, top };
  };

  let current = newPage();
  let top = current.top;

  const titleSize = 28;
  current.page.drawText(copy.title, {
    x: MARGIN_X,
    y: top - titleSize,
    font: displayFont,
    size: titleSize,
    color: COLORS.ink,
  });
  top -= titleSize + 12;
  top -= drawWrappedText(
    current.page,
    copy.intro,
    MARGIN_X,
    top,
    CONTENT_WIDTH,
    bodyFont,
    10.5,
    COLORS.body,
    14,
  );
  top -= 10;
  top -= drawWrappedText(
    current.page,
    `${copy.generated}: ${formatDateTime(data.exportedAt, locale)}`,
    MARGIN_X,
    top,
    CONTENT_WIDTH,
    bodyMediumFont,
    8.5,
    COLORS.primary,
    12,
  );
  top -= 22;

  const accountRows: KeyValueRow[] = [
    { label: copy.name, value: cleanText(`${data.account.firstName} ${data.account.lastName}`) },
    { label: copy.email, value: cleanText(data.account.email) },
    {
      label: copy.emailVerified,
      value: data.account.emailVerified ? copy.verified : copy.notVerified,
    },
  ];
  top = drawSectionHeading(current.page, copy.account, top, displayFont);
  top = drawKeyValueCard(current.page, accountRows, top, bodyFont, bodyMediumFont) - 24;

  const providers = data.authenticationProviders.map((provider) =>
    providerLabel(provider.provider, copy),
  );
  const providerHeight = providerCardHeight(
    providers.length ? providers : [copy.noSignInMethods],
    bodyFont,
  );
  if (top - 34 - providerHeight < CONTENT_BOTTOM) {
    current = newPage();
    top = current.top;
  }
  top = drawSectionHeading(current.page, copy.signInMethods, top, displayFont);
  top = drawProviderCard(current.page, providers, top, bodyFont, copy) - 24;

  const minimumAppointmentsSpace = 34 + 29 + 36;
  if (top - minimumAppointmentsSpace < CONTENT_BOTTOM) {
    current = newPage();
    top = current.top;
  }
  top = drawSectionHeading(current.page, copy.appointments, top, displayFont);

  if (!data.appointments.length) {
    top = drawKeyValueCard(
      current.page,
      [{ label: copy.appointments, value: copy.noAppointments }],
      top,
      bodyFont,
      bodyMediumFont,
    );
  } else {
    top = drawTableHeader(current.page, top, bodyMediumFont, copy);
    data.appointments.forEach((appointment, index) => {
      const values = tableRowValues(appointment, locale);
      const height = tableRowHeight(values, bodyFont);
      if (top - height < CONTENT_BOTTOM) {
        current = newPage();
        top = drawTableHeader(current.page, current.top, bodyMediumFont, copy);
      }
      top = drawTableRow(current.page, values, top, height, index, bodyFont, bodyMediumFont);
    });
    top -= 22;
  }

  if (top - 72 < CONTENT_BOTTOM) {
    current = newPage();
    top = current.top;
  }
  drawPrivacyNote(current.page, copy.privacyNote, top, bodyFont);

  pages.forEach((page, index) => drawFooter(page, index + 1, pages.length, bodyFont, copy));
  return pdf.save();
}

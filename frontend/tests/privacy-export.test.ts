import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import test from "node:test";
import type { AppointmentStatus } from "../src/lib/appointment-types";
import { appointmentServiceLabel } from "../src/lib/appointment-types";
import { appointmentStatusLabel, formatDateTime } from "../src/lib/presentation";
import { createPortableDataExport, type PortableExportInput } from "../src/lib/privacy-export";
import {
  createPersonalDataExportPdf,
  getPrivacyExportCopy,
  type PersonalDataExportPdfAssets,
} from "../src/lib/privacy-export-pdf";

const timestamp = new Date("2026-01-15T18:30:00.000Z");

async function loadPdfAssets(): Promise<PersonalDataExportPdfAssets> {
  const assetUrls = {
    logo: new URL("../public/assets/eikon-mind-mark.png", import.meta.url),
    displayFont: new URL("../public/assets/fonts/cormorant-garamond-pdf-400.ttf", import.meta.url),
    bodyFont: new URL("../public/assets/fonts/inter-pdf-400.ttf", import.meta.url),
    bodyMediumFont: new URL("../public/assets/fonts/inter-pdf-500.ttf", import.meta.url),
  };

  const entries = await Promise.all(
    Object.entries(assetUrls).map(
      async ([key, url]) => [key, new Uint8Array(await readFile(url))] as const,
    ),
  );
  return Object.fromEntries(entries) as PersonalDataExportPdfAssets;
}

function makeExportInput(
  appointments: PortableExportInput["appointments"] = [
    {
      startsAt: timestamp,
      endsAt: new Date("2026-01-15T19:30:00.000Z"),
      serviceCode: "PROFESSIONAL_TRAINING",
      status: "CONFIRMED",
      cancelledAt: null,
    },
  ],
): PortableExportInput {
  return {
    exportedAt: timestamp,
    account: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.test",
      emailVerified: true,
    },
    authenticationProviders: [{ provider: "credential" }],
    appointments,
  };
}

test("portable export keeps only the reduced account, provider, and appointment fields", () => {
  const baseInput = makeExportInput();
  const input = {
    ...baseInput,
    account: {
      ...baseInput.account,
      createdAt: timestamp,
      updatedAt: timestamp,
      role: "client",
      twoFactorEnabled: true,
    },
    authenticationProviders: [
      {
        provider: "credential",
        linkedAt: timestamp,
        accessToken: "should-not-export",
        refreshToken: "should-not-export",
      },
    ],
    appointments: [
      {
        ...baseInput.appointments[0],
        clientId: "internal-client-id",
        therapistId: "internal-therapist-id",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    password: "should-not-export",
    securityEvents: [{ event: "login" }],
  } as unknown as PortableExportInput;

  const body = createPortableDataExport(input);

  assert.deepEqual(body, {
    exportedAt: timestamp,
    account: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.test",
      emailVerified: true,
    },
    authenticationProviders: [{ provider: "credential" }],
    appointments: [
      {
        startsAt: timestamp,
        endsAt: new Date("2026-01-15T19:30:00.000Z"),
        serviceCode: "PROFESSIONAL_TRAINING",
        status: "CONFIRMED",
        cancelledAt: null,
      },
    ],
  });
  assert.notStrictEqual(body.exportedAt, timestamp);
  assert.deepEqual(Object.keys(body.account), ["firstName", "lastName", "email", "emailVerified"]);
  assert.deepEqual(Object.keys(body.authenticationProviders[0]), ["provider"]);
  assert.deepEqual(Object.keys(body.appointments[0]), [
    "startsAt",
    "endsAt",
    "serviceCode",
    "status",
    "cancelledAt",
  ]);
  assert.equal(body.appointments[0].serviceCode, "PROFESSIONAL_TRAINING");
  assert.doesNotMatch(
    JSON.stringify(body),
    /password|secret|token|backup|security|therapist|clientId|createdAt|updatedAt|linkedAt|role/i,
  );
});

test("localized PDF exports have branded metadata, diacritics, Bucharest dates, and empty states", async () => {
  const assets = await loadPdfAssets();
  const baseInput = makeExportInput([
    {
      startsAt: timestamp,
      endsAt: new Date("2026-01-15T19:30:00.000Z"),
      serviceCode: "ADDICTION",
      status: "CANCELLED",
      cancelledAt: new Date("2026-01-14T12:00:00.000Z"),
    },
  ]);
  const data = createPortableDataExport({
    ...baseInput,
    account: {
      firstName: "Ștefan",
      lastName: "Mureșan",
      email: "stefan@example.test",
      emailVerified: false,
    },
    authenticationProviders: [{ provider: "google" }],
  });
  const pdfBytes = await createPersonalDataExportPdf(data, "ro", assets);
  const pdf = await PDFDocument.load(pdfBytes);

  assert.match(new TextDecoder().decode(pdfBytes.subarray(0, 8)), /^%PDF-/);
  assert.equal(pdf.getTitle(), "Eikon Mind - Export de date personale");
  assert.equal(pdf.getAuthor(), "Eikon Mind");
  assert.equal(pdf.getSubject(), "Rezumat al exportului de date personale");
  assert.equal(pdf.getPages().length, 1);
  assert.equal(getPrivacyExportCopy("en").verified, "Verified");
  assert.equal(getPrivacyExportCopy("ro").notVerified, "Neverificat");
  assert.equal(appointmentServiceLabel("ADDICTION", "en"), "Addiction");
  assert.equal(appointmentServiceLabel("ADDICTION", "ro"), "Dependență");
  assert.equal(appointmentStatusLabel("CANCELLED", "en"), "Cancelled");
  assert.equal(appointmentStatusLabel("CANCELLED", "ro"), "Anulată");
  assert.equal(formatDateTime(timestamp, "en"), "15 Jan 2026, 20:30");
  assert.equal(formatDateTime(timestamp, "ro"), "15 ian. 2026, 20:30");

  const emptyData = createPortableDataExport(makeExportInput([]));
  const emptyPdf = await createPersonalDataExportPdf(emptyData, "en", assets);
  const emptyDocument = await PDFDocument.load(emptyPdf);
  assert.equal(emptyDocument.getPages().length, 1);
  assert.ok(pdfBytes.byteLength > 1_000);
});

test("multi-appointment exports paginate without invalid PDF bytes", async () => {
  const assets = await loadPdfAssets();
  const appointments = Array.from({ length: 40 }, (_, index) => ({
    startsAt: new Date(timestamp.getTime() + index * 86_400_000),
    endsAt: new Date(timestamp.getTime() + index * 86_400_000 + 3_600_000),
    serviceCode: index % 2 ? "ADULT" : "PROFESSIONAL_TRAINING",
    status: (index % 2 ? "REQUESTED" : "CONFIRMED") as AppointmentStatus,
    cancelledAt: null,
  }));
  const data = createPortableDataExport(makeExportInput(appointments));
  const pdfBytes = await createPersonalDataExportPdf(data, "en", assets);
  const pdf = await PDFDocument.load(pdfBytes);

  assert.ok(pdf.getPages().length > 1);
  assert.match(new TextDecoder().decode(pdfBytes.subarray(0, 8)), /^%PDF-/);
});

test("export route is authenticated, private, localized, downloadable, and scoped by the session user", async () => {
  const source = await readFile(
    new URL("../src/app/api/privacy/export/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /searchParams\.get\("locale"\) \?\? "en"/);
  assert.match(source, /isLocale\(locale\)/);
  assert.match(source, /auth\.api\.getSession\(\{ headers: request\.headers \}\)/);
  assert.match(source, /if \(!session\) return unauthorized\(\)/);
  assert.match(source, /eq\(users\.id, session\.user\.id\)/);
  assert.match(source, /eq\(accounts\.userId, session\.user\.id\)/);
  assert.match(source, /eq\(appointments\.clientId, session\.user\.id\)/);
  assert.match(source, /Cache-Control.*private, no-store, max-age=0/);
  assert.match(source, /Content-Disposition.*eikon-mind-personal-data\.pdf/);
  assert.match(source, /Content-Language.*locale/);
  assert.match(source, /Content-Type.*application\/pdf/);
  assert.match(source, /status: 400/);
  assert.match(source, /status: 401/);
  assert.match(source, /status: 503/);
  assert.doesNotMatch(source, /JSON\.stringify/);

  for (const disallowedField of [
    "accessToken",
    "refreshToken",
    "idToken",
    "password",
    "createdAt",
    "updatedAt",
    "linkedAt",
    "role",
    "twoFactorEnabled",
    "sessions",
    "securityEvents",
    "therapistId",
  ]) {
    assert.ok(!source.includes(disallowedField), `route must not select ${disallowedField}`);
  }
});

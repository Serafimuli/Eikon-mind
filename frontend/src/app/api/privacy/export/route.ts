import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { accounts, appointments, users } from "@/lib/db/schema";
import { isLocale } from "@/lib/auth-routing";
import { createPortableDataExport } from "@/lib/privacy-export";
import {
  createPersonalDataExportPdf,
  type PersonalDataExportPdfAssets,
} from "@/lib/privacy-export-pdf";
import { getApplicationOrigin } from "@/lib/platform-env";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

function invalidLocale() {
  return NextResponse.json(
    { error: "Invalid locale" },
    { status: 400, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

function exportUnavailable() {
  return NextResponse.json(
    { error: "The data export is temporarily unavailable" },
    { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

const PDF_ASSET_PATHS = {
  logo: "/assets/eikon-mind-mark.png",
  displayFont: "/assets/fonts/cormorant-garamond-pdf-400.ttf",
  bodyFont: "/assets/fonts/inter-pdf-400.ttf",
  bodyMediumFont: "/assets/fonts/inter-pdf-500.ttf",
} as const;

const pdfAssetsByOrigin = new Map<string, Promise<PersonalDataExportPdfAssets>>();

async function loadPdfAsset(origin: string, path: string) {
  const response = await fetch(new URL(path, origin));
  if (!response.ok) throw new Error("Required export asset unavailable");
  return new Uint8Array(await response.arrayBuffer());
}

function getPdfAssets() {
  const origin = getApplicationOrigin();
  const existing = pdfAssetsByOrigin.get(origin);
  if (existing) return existing;

  const loading = Promise.all(
    Object.entries(PDF_ASSET_PATHS).map(async ([key, path]) => [
      key,
      await loadPdfAsset(origin, path),
    ]),
  ).then((entries) => Object.fromEntries(entries) as PersonalDataExportPdfAssets);
  pdfAssetsByOrigin.set(origin, loading);
  return loading;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") ?? "en";
  if (!isLocale(locale)) return invalidLocale();

  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return unauthorized();

  const db = getDb();
  const [accountRows, providerRows, appointmentRows] = await Promise.all([
    db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
    db
      .select({ provider: accounts.providerId })
      .from(accounts)
      .where(eq(accounts.userId, session.user.id))
      .orderBy(asc(accounts.providerId)),
    db
      .select({
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        serviceCode: appointments.serviceCode,
        status: appointments.status,
        cancelledAt: appointments.cancelledAt,
      })
      .from(appointments)
      .where(eq(appointments.clientId, session.user.id))
      .orderBy(asc(appointments.startsAt)),
  ]);

  const account = accountRows[0];
  if (!account) return unauthorized();

  try {
    const data = createPortableDataExport({
      exportedAt: new Date(),
      account,
      authenticationProviders: providerRows,
      appointments: appointmentRows,
    });
    const pdf = await createPersonalDataExportPdf(data, locale, await getPdfAssets());
    const pdfBuffer = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(pdfBuffer).set(pdf);

    return new Response(pdfBuffer, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": 'attachment; filename="eikon-mind-personal-data.pdf"',
        "Content-Language": locale,
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    console.error("Personal data export generation failed");
    return exportUnavailable();
  }
}

import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { accounts, appointments, users } from "@/lib/db/schema";
import { isLocale } from "@/lib/auth-routing";
import { getApplicationOrigin, getRuntimeEnv } from "@/lib/platform-env";

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

type PersonalDataExportPdfAssets = {
  logo: Uint8Array;
  displayFont: Uint8Array;
  bodyFont: Uint8Array;
  bodyMediumFont: Uint8Array;
};

type AssetsFetcher = { fetch(request: Request): Promise<Response> };

const pdfAssetsByBinding = new WeakMap<AssetsFetcher, Promise<PersonalDataExportPdfAssets>>();
let localPdfAssetsPromise: Promise<PersonalDataExportPdfAssets> | undefined;

async function loadPdfAsset(path: string, requestUrl: string) {
  const env = getRuntimeEnv();
  const response =
    env.APP_ENV === "local"
      ? await fetch(new URL(path, getApplicationOrigin()))
      : await (env.ASSETS as AssetsFetcher).fetch(new Request(new URL(path, requestUrl)));
  if (!response.ok) throw new Error("Required export asset unavailable");
  return new Uint8Array(await response.arrayBuffer());
}

function loadPdfAssets(requestUrl: string) {
  return Promise.all(
    Object.entries(PDF_ASSET_PATHS).map(async ([key, path]) => [
      key,
      await loadPdfAsset(path, requestUrl),
    ]),
  ).then((entries) => Object.fromEntries(entries) as PersonalDataExportPdfAssets);
}

function getPdfAssets(requestUrl: string) {
  const env = getRuntimeEnv();
  if (env.APP_ENV === "local") {
    if (localPdfAssetsPromise) return localPdfAssetsPromise;

    const loading = loadPdfAssets(requestUrl);
    localPdfAssetsPromise = loading;
    void loading.catch(() => {
      if (localPdfAssetsPromise === loading) localPdfAssetsPromise = undefined;
    });
    return loading;
  }

  const assets = env.ASSETS as AssetsFetcher;
  const existing = pdfAssetsByBinding.get(assets);
  if (existing) return existing;

  const loading = loadPdfAssets(requestUrl);
  pdfAssetsByBinding.set(assets, loading);
  void loading.catch(() => {
    if (pdfAssetsByBinding.get(assets) === loading) pdfAssetsByBinding.delete(assets);
  });
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
    const [{ createPortableDataExport }, { createPersonalDataExportPdf }] = await Promise.all([
      import("@/lib/privacy-export"),
      import("@/lib/privacy-export-pdf"),
    ]);
    const data = createPortableDataExport({
      exportedAt: new Date(),
      account,
      authenticationProviders: providerRows,
      appointments: appointmentRows,
    });
    const pdf = await createPersonalDataExportPdf(data, locale, await getPdfAssets(request.url));
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

import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { accounts, appointments, users } from "@/lib/db/schema";
import { createPortableDataExport } from "@/lib/privacy-export";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function GET(request: Request) {
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
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
    db
      .select({ provider: accounts.providerId, linkedAt: accounts.createdAt })
      .from(accounts)
      .where(eq(accounts.userId, session.user.id))
      .orderBy(asc(accounts.createdAt)),
    db
      .select({
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
        cancelledAt: appointments.cancelledAt,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .where(eq(appointments.clientId, session.user.id))
      .orderBy(asc(appointments.startsAt)),
  ]);

  const account = accountRows[0];
  if (!account) return unauthorized();

  const body = createPortableDataExport({
    exportedAt: new Date(),
    account,
    authenticationProviders: providerRows,
    appointments: appointmentRows,
  });

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": 'attachment; filename="eikon-mind-personal-data.json"',
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

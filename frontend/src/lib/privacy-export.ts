import type { AppointmentStatus } from "@/lib/appointment-types";

export type PortableExportInput = {
  exportedAt: Date;
  account: {
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
  };
  authenticationProviders: Array<{
    provider: string;
  }>;
  appointments: Array<{
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
    cancelledAt: Date | null;
  }>;
};

export type PortableExportData = {
  exportedAt: Date;
  account: PortableExportInput["account"];
  authenticationProviders: PortableExportInput["authenticationProviders"];
  appointments: PortableExportInput["appointments"];
};

/**
 * Builds the portable subset used by the user-facing data export. Keep this
 * boundary narrow: authentication secrets, provider tokens, sessions,
 * security events, internal identifiers, and staff/other-client data must
 * never cross it.
 */
export function createPortableDataExport(input: PortableExportInput): PortableExportData {
  return {
    exportedAt: new Date(input.exportedAt.getTime()),
    account: {
      firstName: input.account.firstName,
      lastName: input.account.lastName,
      email: input.account.email,
      emailVerified: input.account.emailVerified,
    },
    authenticationProviders: input.authenticationProviders.map((provider) => ({
      provider: provider.provider,
    })),
    appointments: input.appointments.map((appointment) => ({
      startsAt: new Date(appointment.startsAt.getTime()),
      endsAt: new Date(appointment.endsAt.getTime()),
      status: appointment.status,
      cancelledAt: appointment.cancelledAt ? new Date(appointment.cancelledAt.getTime()) : null,
    })),
  };
}

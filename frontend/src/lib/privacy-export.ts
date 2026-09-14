export type PortableExportInput = {
  exportedAt: Date;
  account: {
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  authenticationProviders: Array<{
    provider: string;
    linkedAt: Date;
  }>;
  appointments: Array<{
    startsAt: Date;
    endsAt: Date;
    status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

/**
 * Builds the portable subset of a data-subject access response. Keep this
 * boundary narrow: authentication secrets, provider tokens, sessions,
 * security events, and staff/other-client data must never cross it.
 */
export function createPortableDataExport(input: PortableExportInput) {
  return {
    format: "eikon-mind-personal-data-export/v1",
    exportedAt: input.exportedAt.toISOString(),
    account: {
      firstName: input.account.firstName,
      lastName: input.account.lastName,
      email: input.account.email,
      emailVerified: input.account.emailVerified,
      createdAt: input.account.createdAt.toISOString(),
      updatedAt: input.account.updatedAt.toISOString(),
    },
    authenticationProviders: input.authenticationProviders.map((provider) => ({
      provider: provider.provider,
      linkedAt: provider.linkedAt.toISOString(),
    })),
    appointments: input.appointments.map((appointment) => ({
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    })),
  };
}

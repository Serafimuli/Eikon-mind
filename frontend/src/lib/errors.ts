export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_INPUT" | "NOT_FOUND" | "ACCESS_DENIED" | "CONFLICT",
  ) {
    super(message);
    this.name = "DomainError";
  }
}

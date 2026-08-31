export async function resolveSecret(secret: string | SecretsStoreSecret | undefined, name: string) {
  const value = typeof secret === "string" ? secret : await secret?.get();
  if (!value) throw new Error(`Missing required ${name} secret`);
  return value;
}

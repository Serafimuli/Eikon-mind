import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const ALGORITHM = "scrypt";
const FORMAT_VERSION = 1;
const COST = 2 ** 14;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 5;
const SALT_BYTES = 16;
const DERIVED_KEY_BYTES = 64;
const MAX_MEMORY_BYTES = 32 * 1024 * 1024;

const SCRYPT_OPTIONS = {
  N: COST,
  r: BLOCK_SIZE,
  p: PARALLELIZATION,
  maxmem: MAX_MEMORY_BYTES,
} as const;

function deriveKey(password: string, salt: Uint8Array) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, DERIVED_KEY_BYTES, SCRYPT_OPTIONS, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await deriveKey(password, salt);

  return [
    ALGORITHM,
    FORMAT_VERSION,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }) {
  try {
    const [algorithm, version, cost, blockSize, parallelization, saltHex, keyHex] = hash.split("$");

    if (
      algorithm !== ALGORITHM ||
      Number(version) !== FORMAT_VERSION ||
      Number(cost) !== COST ||
      Number(blockSize) !== BLOCK_SIZE ||
      Number(parallelization) !== PARALLELIZATION ||
      saltHex.length !== SALT_BYTES * 2 ||
      keyHex.length !== DERIVED_KEY_BYTES * 2
    ) {
      return false;
    }

    const expected = Buffer.from(keyHex, "hex");
    const actual = await deriveKey(password, Buffer.from(saltHex, "hex"));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const passwordStorageParameters = Object.freeze({
  algorithm: ALGORITHM,
  version: FORMAT_VERSION,
  N: COST,
  r: BLOCK_SIZE,
  p: PARALLELIZATION,
  saltBytes: SALT_BYTES,
  derivedKeyBytes: DERIVED_KEY_BYTES,
});

import { scryptAsync } from "@noble/hashes/scrypt.js";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";

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
  dkLen: DERIVED_KEY_BYTES,
  maxmem: MAX_MEMORY_BYTES,
  asyncTick: 10,
} as const;

function equalBytes(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = await scryptAsync(password, salt, SCRYPT_OPTIONS);

  return [
    ALGORITHM,
    FORMAT_VERSION,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    bytesToHex(salt),
    bytesToHex(derivedKey),
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

    const expected = hexToBytes(keyHex);
    const actual = await scryptAsync(password, hexToBytes(saltHex), SCRYPT_OPTIONS);
    return equalBytes(actual, expected);
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

// Unambiguous alphabet: no 0/O or 1/I. Length 32 divides 256 evenly.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GROUP = 4;
const GROUPS = 4;

export const ACTIVATION_KEY_LENGTH = GROUP * GROUPS;

export function normalizeActivationKey(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, ACTIVATION_KEY_LENGTH);
}

export function formatActivationKey(input) {
  const clean = normalizeActivationKey(input);
  const parts = [];
  for (let i = 0; i < clean.length; i += GROUP) {
    parts.push(clean.slice(i, i + GROUP));
  }
  return parts.join("-");
}

export function isWellFormedActivationKey(input) {
  const clean = normalizeActivationKey(input);
  if (clean.length !== ACTIVATION_KEY_LENGTH) return false;
  return [...clean].every((char) => ALPHABET.includes(char));
}

export function generateActivationKey() {
  const bytes = new Uint8Array(ACTIVATION_KEY_LENGTH);
  crypto.getRandomValues(bytes);
  let raw = "";
  for (const byte of bytes) raw += ALPHABET[byte % ALPHABET.length];
  return formatActivationKey(raw);
}

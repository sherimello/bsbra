/**
 * Deterministic UUIDs for fixture rows, so the preview content and the
 * generated SQL seed share stable identifiers across runs.
 */
export function uid(key: string): string {
  // Four independent 32-bit FNV-1a hashes give 128 bits of output.
  const parts = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b].map((seed, round) => {
    let h = seed >>> 0;
    const input = `${round}:${key}`;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  });
  const hex = parts.join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

export const FIXTURE_TIMESTAMP = "2026-10-01T09:00:00.000Z";

export function meta(key: string, timestamp = FIXTURE_TIMESTAMP) {
  return {
    id: uid(key),
    created_at: timestamp,
    created_by: null,
    updated_at: timestamp,
    updated_by: null,
  };
}

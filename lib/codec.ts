import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";

export function encode(data: unknown): string {
  const json = JSON.stringify(data);
  const compressed = gzipSync(strToU8(json), { level: 9 });

  // Chunk to avoid call stack overflow on large arrays
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < compressed.length; i += CHUNK) {
    binary += String.fromCharCode(...compressed.subarray(i, i + CHUNK));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decode<T>(hash: string): T | null {
  try {
    const b64 = hash.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(strFromU8(gunzipSync(bytes))) as T;
  } catch {
    return null;
  }
}

/** Oscurece (amount negativo) o aclara (positivo) un color hex sumando a cada canal. */
export function shadeColor(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const clamp = (c: number) => Math.max(0, Math.min(255, c));
  const r = clamp(((num >> 16) & 0xff) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return `#${(r * 65536 + g * 256 + b).toString(16).padStart(6, "0")}`;
}

/** Mezcla un color hex con blanco. amount entre 0 (sin cambio) y 1 (blanco puro). */
export function lighten(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `#${(r * 65536 + g * 256 + b).toString(16).padStart(6, "0")}`;
}

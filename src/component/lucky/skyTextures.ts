import { CanvasTexture, SRGBColorSpace } from "three";
import { clamp01, fbm, smoothstep } from "@/lib/noise";

/** Procedural textures for the sky. Browser-only (uses <canvas>). */

function paint(width: number, height: number, pixel: (x: number, y: number) => [number, number, number, number]) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  const image = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y);
      const i = (y * width + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = a;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * A cumulus cloud: fractal density with a flat base, lit from the upper left
 * (bright tops, bluish-gray shaded undersides) and soft feathered edges.
 */
export function cloudTexture(seed: number) {
  const w = 512;
  const h = 256;
  return paint(w, h, (px, py) => {
    const nx = px / w;
    const ny = py / h;
    const dx = (nx - 0.5) * 2;
    const dy = (ny - 0.58) * 2.1;
    const mask = clamp01(1 - (dx * dx * 0.85 + dy * dy));
    const sx = nx * 4.2 + seed * 3.1;
    const sy = ny * 2.6;
    const base = fbm(sx, sy, 6, seed);
    const density =
      smoothstep(0.47, 0.77, base * 0.95 + mask * 0.55 - 0.2) *
      smoothstep(0.96, 0.74, ny); // flat bottom
    // Shade by comparing density toward the light (upper left).
    const lit = fbm(sx - 0.07, sy - 0.1, 6, seed);
    const shade = clamp01(0.55 + (base - lit) * 9 + (0.5 - ny) * 0.55);
    return [
      mix(140, 255, shade),
      mix(158, 255, shade),
      mix(190, 255, shade),
      density * 255,
    ];
  });
}

/** The sun: blazing white core, warm inner glow and a wide faint corona. */
export function sunTexture() {
  const s = 512;
  return paint(s, s, (px, py) => {
    const d = Math.hypot(px - s / 2, py - s / 2) / (s / 2);
    const core = smoothstep(0.075, 0.045, d);
    const glow = Math.exp(-d * 7) * 0.9;
    const corona = Math.exp(-d * 2.6) * 0.32;
    // Fade to exactly zero at the texture edge so the sprite has no visible square.
    const a = clamp01(core + glow + corona) * smoothstep(1, 0.7, d);
    const white = clamp01(core + glow * 0.55);
    return [255, mix(214, 255, white), mix(140, 245, white), a * 255];
  });
}

/** The moon: pale disc with dark maria, small craters and limb darkening. */
export function moonTexture() {
  const s = 512;
  const radius = 0.34; // disc radius as a fraction of the texture
  return paint(s, s, (px, py) => {
    const x = (px - s / 2) / (s / 2);
    const y = (py - s / 2) / (s / 2);
    const d = Math.hypot(x, y);
    // Halo outside the disc.
    const halo = Math.exp(-(d - radius) * 7) * 0.4;
    if (d > radius) {
      return [196, 212, 255, clamp01(halo) * 255 * smoothstep(1, 0.45, d)];
    }
    const nx = x / radius;
    const ny = y / radius;
    const edge = smoothstep(1, 0.985, Math.hypot(nx, ny));
    const maria = smoothstep(0.5, 0.62, fbm(nx * 1.9 + 4, ny * 1.9 + 2, 5, 11));
    const craters = smoothstep(0.58, 0.8, fbm(nx * 9, ny * 9, 3, 5)) * 0.18;
    const limb = 1 - 0.28 * Math.hypot(nx, ny) ** 3;
    const tone = clamp01((0.96 - maria * 0.3 - craters) * limb);
    return [mix(120, 247, tone), mix(124, 244, tone), mix(132, 232, tone), 255 * mix(edge, 1, 0.0) + halo * 40 * (1 - edge)];
  });
}

/** Faint Milky Way band: a tilted dusty arc across a night sky dome. */
export function milkyWayTexture() {
  const w = 512;
  const h = 256;
  return paint(w, h, (px, py) => {
    const u = px / w;
    const v = py / h;
    // Band centred on a sine curve around the dome.
    const center = 0.5 + Math.sin(u * Math.PI * 2) * 0.16;
    const dist = Math.abs(v - center);
    const band = Math.exp(-(dist * dist) / 0.0075);
    const dust = fbm(u * 14, v * 7, 6, 2);
    const dark = smoothstep(0.55, 0.75, fbm(u * 22 + 3, v * 10, 4, 9));
    const a = clamp01(band * (0.25 + dust * 0.75) * (1 - dark * 0.7)) * 0.55;
    return [190 + dust * 50, 200 + dust * 40, 255, a * 255];
  });
}

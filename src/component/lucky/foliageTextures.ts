import { CanvasTexture, SRGBColorSpace } from "three";
import { fbm } from "@/lib/noise";

/**
 * Leaf surface: a pale mid-rib, pairs of side veins that sweep toward the tip,
 * darker edges and subtle mottling. Near-white so per-instance green tints
 * multiply cleanly; the same image is used as a bump map for vein relief.
 * `u` runs across the leaf (0..1), `v` from the base (0) to the tip (1).
 */
export function leafTexture() {
  const w = 128;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);
  const image = ctx.createImageData(w, h);
  const veins = [0.06, 0.16, 0.27, 0.38, 0.5, 0.62];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / (w - 1)) * 2 - 1; // -1..1 across
      const v = 1 - y / (h - 1); // canvas top = tip
      const au = Math.abs(u);

      let shade = 0.84 + 0.1 * fbm(x * 0.06, y * 0.06, 3, 4);
      shade *= 1 - 0.22 * au ** 3; // darker margins

      // Mid-rib.
      if (au < 0.035 * (1 - 0.6 * v)) shade = 1;
      else if (au < 0.07 * (1 - 0.6 * v)) shade *= 0.92;

      // Side veins leave the rib and sweep toward the tip.
      for (const v0 of veins) {
        const d = Math.abs(v - (v0 + au * 0.95));
        if (d < 0.011 && au > 0.03 && au < 0.9 - v0 * 0.4) {
          shade = Math.max(shade, 0.98 - au * 0.2);
        } else if (d < 0.022 && au > 0.03) {
          shade *= 0.95;
        }
      }

      const g = Math.round(Math.min(1, shade) * 255);
      const i = (y * w + x) * 4;
      image.data[i] = g;
      image.data[i + 1] = g;
      image.data[i + 2] = g;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

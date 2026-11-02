import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { fbm } from "@/lib/noise";

/** An indigo longyi cloth with subtle wavy zig-zag lines and a woven grain. */
export function longyiTexture() {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#3d4a92";
    ctx.fillRect(0, 0, s, s);
    // Rows of soft zig-zags running around the cloth.
    ctx.strokeStyle = "rgba(130,148,225,0.38)";
    ctx.lineWidth = 1.6;
    const rows = 8;
    const step = 16;
    for (let r = 0; r < rows; r++) {
      const y = (r + 0.5) * (s / rows);
      ctx.beginPath();
      for (let x = 0; x <= s; x += step) {
        const yy = y + ((x / step) % 2 === 0 ? -4 : 4);
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    // Woven grain.
    const image = ctx.getImageData(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n = (fbm(x * 0.8, y * 0.1, 2, 3) - 0.5) * 22 + ((x + y) % 2 ? 3 : -3);
        const i = (y * s + x) * 4;
        image.data[i] = Math.max(0, Math.min(255, image.data[i] + n));
        image.data[i + 1] = Math.max(0, Math.min(255, image.data[i + 1] + n));
        image.data[i + 2] = Math.max(0, Math.min(255, image.data[i + 2] + n));
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(4, 2.4);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A soft cotton weave for the shirt. */
export function shirtTexture() {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const n = fbm(x * 0.5, y * 0.5, 3, 8);
        const v = 244 + (n - 0.5) * 16 + ((x + y) % 2 ? 2 : -2);
        const i = (y * s + x) * 4;
        image.data[i] = v;
        image.data[i + 1] = v - 2;
        image.data[i + 2] = v - 10;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Animal fur: fine streaks of light and dark along the body. */
export function furTexture() {
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const streak = fbm(x * 0.7, y * 0.06, 4, 5);
        const clump = fbm(x * 0.05, y * 0.05, 3, 9);
        const v = 150 + streak * 90 + clump * 25;
        const i = (y * w + x) * 4;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = Math.min(255, v);
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(2, 2);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Skin: gentle mottling, warmer cheeks and fine pores. Multiplies the skin colour. */
export function skinTexture() {
  const s = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const blotch = fbm(x * 0.05, y * 0.05, 3, 21);
        const pores = fbm(x * 0.9, y * 0.9, 2, 4);
        const v = 232 + (blotch - 0.5) * 38 + (pores - 0.5) * 14;
        const i = (y * s + x) * 4;
        image.data[i] = Math.min(255, v + 6);
        image.data[i + 1] = Math.min(255, v - 2);
        image.data[i + 2] = Math.min(255, v - 8);
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const t = new CanvasTexture(canvas);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}

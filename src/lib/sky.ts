import type { Vec3 } from "@/lib/tree";

const VFOV = (40 * Math.PI) / 180;
/** Elevation of the visible sun/moon above the horizon, in radians. */
const ELEVATION = 0.3;
/** Lower on tall screens, where the title chip covers the top of the view. */
const PORTRAIT_ELEVATION = 0.17;

/**
 * Unit direction (from the world origin) of the sun or moon, chosen so it is
 * always inside the camera's view: sun left of centre, moon right of centre,
 * and never further out than the narrower screens' horizontal field of view.
 * The camera looks toward -z.
 */
export function celestialDirection(
  width: number,
  height: number,
  night: boolean,
): Vec3 {
  const aspect = width / height;
  const halfH = Math.atan(Math.tan(VFOV / 2) * aspect);
  const azimuth = Math.min(halfH * 0.6, 0.5) * (night ? 1 : -1);
  const elevation = aspect < 1 ? PORTRAIT_ELEVATION : ELEVATION;
  const c = Math.cos(elevation);
  return [Math.sin(azimuth) * c, Math.sin(elevation), -Math.cos(azimuth) * c];
}

import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  Shape,
  ShapeGeometry,
} from "three";

/** Base envelope size in metres; scale factors are applied per use. */
export const ENV_W = 0.5;
export const ENV_H = 0.34;
export const ENV_T = 0.025;

export function flapShape() {
  const s = new Shape();
  s.moveTo(-ENV_W / 2, 0);
  s.lineTo(ENV_W / 2, 0);
  s.lineTo(0, -ENV_H * 0.58);
  s.closePath();
  return s;
}

/** The envelope body. */
export function makeBody(): BufferGeometry {
  return new BoxGeometry(ENV_W, ENV_H, ENV_T);
}

/** The flap lying closed over the front, hinged on the top edge. */
export function makeClosedFlap(): BufferGeometry {
  const flap = new ShapeGeometry(flapShape());
  flap.translate(0, ENV_H / 2, ENV_T / 2 + 0.004);
  return flap;
}

export function makeSeal() {
  const g = new CylinderGeometry(0.035, 0.035, 0.014, 18);
  g.rotateX(Math.PI / 2);
  g.translate(0, ENV_H / 2 - ENV_H * 0.58, ENV_T / 2 + 0.012);
  return g;
}

/** A thin string from the top of the envelope up to its branch. */
export function makeString(length: number) {
  const g = new CylinderGeometry(0.004, 0.004, length, 5);
  g.translate(0, ENV_H / 2 + length / 2, 0);
  return g;
}

import { Color } from "three";
import type { Pose } from "@/lib/robot";

const CYAN = new Color("#5ff5ff");
const AMBER = new Color("#ffc766");
const RED = new Color("#ff4d5e");
const GREEN = new Color("#5dff9a");

/** The robot's light colour: cyan by day, amber at night, red on error, green when happy. */
export function stateColor(
  out: Color,
  pose: Pick<Pose, "alert" | "ok">,
  night: boolean,
) {
  return out
    .copy(night ? AMBER : CYAN)
    .lerp(RED, pose.alert)
    .lerp(GREEN, pose.ok);
}

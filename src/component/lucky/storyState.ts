import type { StoryPhase } from "@/lib/story";

/** Mutable state shared by the scene pieces each frame (kept in a ref). */
export type Story = {
  phase: StoryPhase;
  /** Seconds since the current phase began. */
  t: number;
  /** How hard the tree is being shaken, 0..1. */
  shake: number;
  /** Set by the envelope when it has landed. */
  envLanded: boolean;
  /** Story time at which the envelope landed. */
  landedAt: number;
  /** The phase-end callback has already fired for this phase. */
  ended: boolean;
};

export function createStory(): Story {
  return { phase: "idle", t: 0, shake: 0, envLanded: false, landedAt: 0, ended: false };
}

/** Called by the envelope when it settles on the ground. */
export function markEnvelopeLanded(s: Story): void {
  if (s.envLanded) return;
  s.envLanded = true;
  s.landedAt = s.t;
}

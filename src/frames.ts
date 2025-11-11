/**
 * Coordinate frame conversions between RIC and LVLH frames.
 *
 * Under the conventions in this module, the internal coordinate ordering equals LVLH:
 * - x: along-track (I)
 * - y: cross-track (C)
 * - z: radial (R)
 *
 * Therefore, conversion:
 * - LVLH [I, C, R] <-> internal [x, y, z] is identity
 * - RIC [R, I, C] <-> internal [x, y, z] is a permutation only (no inertial rotation)
 */

import type { Frame, RelativeState, Vector3 } from "@/types";

/**
 * Convert a relative state from an external local-orbital frame (RIC/LVLH)
 * into the module's internal LVLH ordering [x=I, y=C, z=R].
 *
 * - If from = 'LVLH', this is identity (LVLH == internal)
 * - If from = 'RIC', applies [R, I, C] -> [I, C, R]
 *
 * @param state - Relative state in external frame
 * @param from - External frame: 'RIC' or 'LVLH'
 * @returns Relative state in internal ordering [x=I, y=C, z=R]
 */
export const toInternalFromFrame = (
  state: RelativeState,
  from: Frame
): RelativeState => {
  if (from === "RIC") {
    // External order [R, I, C] -> Internal [x, y, z] = [I, C, R]
    const [r, i, c] = state.position;
    const [vr, vi, vc] = state.velocity;
    const position: Vector3 = [i, c, r];
    const velocity: Vector3 = [vi, vc, vr];
    return { position, velocity };
  }
  // LVLH is already internal ordering [I, C, R]
  return state;
};

/**
 * Convert a relative state from the module's internal LVLH ordering [x=I, y=C, z=R]
 * to an external local-orbital frame (RIC/LVLH).
 *
 * - If to = 'LVLH', this is identity (LVLH == internal)
 * - If to = 'RIC', applies [I, C, R] -> [R, I, C]
 *
 * @param state - Relative state in internal ordering [x=I, y=C, z=R]
 * @param to - External frame: 'RIC' or 'LVLH'
 * @returns Relative state in external frame ordering
 */
export const fromInternalToFrame = (
  state: RelativeState,
  to: Frame
): RelativeState => {
  if (to === "RIC") {
    // Internal [x, y, z] = [I, C, R] -> External [R, I, C] = [z, x, y]
    const [ix, iy, iz] = state.position; // ix=I, iy=C, iz=R
    const [vix, viy, viz] = state.velocity;
    const position: Vector3 = [iz, ix, iy];
    const velocity: Vector3 = [viz, vix, viy];
    return { position, velocity };
  }
  // LVLH is already internal ordering [I, C, R]
  return state;
};

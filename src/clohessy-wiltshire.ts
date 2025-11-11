/**
 * Clohessy-Wiltshire (Hill-Clohessy-Wiltshire) propagation for circular orbits.
 *
 * Reference: The YA STM reduces to the CW solution in the circular limit. This
 * function provides a direct CW propagation for validation and comparison (cf.
 * Yamanaka-Ankersen (2002), discussion around the e -> 0 limit, e.g., Eq. (91)).
 */

import type { Frame, RelativeState } from "@/types";
import { fromInternalToFrame, toInternalFromFrame } from "@/frames";

/**
 * Propagate using the classical Clohessy-Wiltshire (Hill's) equations for e = 0.
 *
 * Reference: The YA STM reduces to the CW solution in the circular limit. This
 * function provides a direct CW propagation for validation and comparison (cf.
 * Yamanaka-Ankersen (2002), discussion around the e -> 0 limit, e.g., Eq. (91)).
 *
 * @param initialState - Relative state in true coordinates; position [m], velocity [m/s]
 * @param orbitalRate - Mean motion n for the circular reference orbit [rad/s]
 * @param deltaTime - Time difference (t - t0) [s]
 * @param frame - Interpret input as [R, I, C] in this frame and return output in the same frame
 * @returns Final relative state under CW dynamics in the provided frame
 */
export const propagateHCW = (
  initialState: RelativeState,
  orbitalRate: number,
  deltaTime: number,
  frame: Frame
): RelativeState => {
  // Map input frame to internal LVLH ordering
  const internalInitial = toInternalFromFrame(initialState, frame);

  const n = orbitalRate;
  const dt = deltaTime;
  const nt = n * dt;

  const sinNt = Math.sin(nt);
  const cosNt = Math.cos(nt);

  const [x0, y0, z0] = internalInitial.position;
  const [vx0, vy0, vz0] = internalInitial.velocity;

  const x =
    x0 +
    6 * (nt - sinNt) * z0 +
    (1 / n) * (4 * sinNt - 3 * nt) * vx0 +
    (2 / n) * (1 - cosNt) * vz0;
  const z =
    (4 - 3 * cosNt) * z0 + (2 / n) * (cosNt - 1) * vx0 + (1 / n) * sinNt * vz0;

  const vx = 6 * n * (1 - cosNt) * z0 + (4 * cosNt - 3) * vx0 + 2 * sinNt * vz0;
  const vz = 3 * n * sinNt * z0 + -2 * sinNt * vx0 + cosNt * vz0;

  const y = cosNt * y0 + (1 / n) * sinNt * vy0;
  const vy = -n * sinNt * y0 + cosNt * vy0;

  const internalFinal: RelativeState = {
    position: [x, y, z],
    velocity: [vx, vy, vz],
  };

  return fromInternalToFrame(internalFinal, frame);
};

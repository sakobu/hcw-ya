/**
 * Out-of-plane (Y) state transition for the Yamanaka-Ankersen propagation.
 *
 * Reference: Yamanaka-Ankersen (2002), Eq. (84).
 */

import type { OutOfPlaneState, TrueAnomaly } from "@/types";
import { rho } from "@/auxiliary-functions";

/**
 * Propagate the out-of-plane (y) motion in modified coordinates.
 *
 * Reference: Yamanaka-Ankersen (2002), Eq. (84). The y-dynamics reduce to a
 * harmonic oscillator with a rotation in the (y, v_y) plane as theta advances.
 *
 * @param initial - Initial out-of-plane state (y, v_y) in modified coordinates
 * @param e - Eccentricity e in [0, 1)
 * @param theta0 - Initial true anomaly theta0 [rad]
 * @param theta - Final true anomaly theta [rad]
 * @returns Final out-of-plane state in modified coordinates
 */
export const propagateOutOfPlane = (
  initial: OutOfPlaneState,
  e: number,
  theta0: TrueAnomaly,
  theta: TrueAnomaly
): OutOfPlaneState => {
  const rho0 = rho(e, theta0);
  const rhoT = rho(e, theta);

  const deltaTheta = theta - theta0;
  const cosDelta = Math.cos(deltaTheta);
  const sinDelta = Math.sin(deltaTheta);

  const factor = 1 / (rhoT / rho0);

  const y = factor * (cosDelta * initial.y + sinDelta * initial.vy);
  const vy = factor * (-sinDelta * initial.y + cosDelta * initial.vy);

  return { y, vy };
};

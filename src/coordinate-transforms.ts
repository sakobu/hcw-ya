/**
 * Transformations between true and modified coordinates for the Yamanaka-Ankersen STM.
 *
 * Reference: Yamanaka-Ankersen (2002), modified-coordinate transform preceding the
 * in-plane/out-of-plane STM (see discussion around Eqs. (80)-(84)).
 */

import type {
  OrbitalElements,
  RelativeState,
  TrueAnomaly,
  Vector3,
} from "@/types";
import { kSquared, rho } from "@/auxiliary-functions";

/**
 * Transform a relative state from true to modified coordinates used by the YA STM.
 *
 * Definitions (as used in the paper's modified-coordinate formulation):
 * - r_tilde = rho*r
 * - v_tilde = -e*sin(theta)*r + (1 / (k^2*rho))*v
 *
 * Reference: Yamanaka-Ankersen (2002), modified-coordinate transform preceding the
 * in-plane/out-of-plane STM (see discussion around Eqs. (80)-(84)).
 *
 * @param state - Relative state in true coordinates; position [m], velocity [m/s]
 * @param elements - Orbital elements providing e, mu, h
 * @param theta - True anomaly theta at the state epoch [rad]
 * @returns Relative state expressed in modified coordinates
 */
export const toModifiedCoordinates = (
  state: RelativeState,
  elements: OrbitalElements,
  theta: TrueAnomaly
): RelativeState => {
  const e = elements.eccentricity;
  const rhoVal = rho(e, theta);
  const k2 = kSquared(elements);
  const eSinTheta = e * Math.sin(theta);

  const position: Vector3 = [
    rhoVal * state.position[0],
    rhoVal * state.position[1],
    rhoVal * state.position[2],
  ];

  const velocity: Vector3 = [
    -eSinTheta * state.position[0] + state.velocity[0] / (k2 * rhoVal),
    -eSinTheta * state.position[1] + state.velocity[1] / (k2 * rhoVal),
    -eSinTheta * state.position[2] + state.velocity[2] / (k2 * rhoVal),
  ];

  return { position, velocity };
};

/**
 * Transform a relative state from modified back to true coordinates.
 *
 * Inverse relations to the modified-coordinate definitions:
 * - r = (1 / rho)*r_tilde
 * - v = k^2*(e*sin(theta)*r_tilde + rho*v_tilde)
 *
 * Reference: Yamanaka-Ankersen (2002), inverse of the modified-coordinate transform
 * (see discussion around Eqs. (80)-(84)).
 *
 * @param modifiedState - Relative state in modified coordinates
 * @param elements - Orbital elements providing e, mu, h
 * @param theta - True anomaly theta at the state epoch [rad]
 * @returns Relative state expressed in true coordinates
 */
export const fromModifiedCoordinates = (
  modifiedState: RelativeState,
  elements: OrbitalElements,
  theta: TrueAnomaly
): RelativeState => {
  const e = elements.eccentricity;
  const rhoVal = rho(e, theta);
  const k2 = kSquared(elements);
  const eSinTheta = e * Math.sin(theta);

  const position: Vector3 = [
    modifiedState.position[0] / rhoVal,
    modifiedState.position[1] / rhoVal,
    modifiedState.position[2] / rhoVal,
  ];

  const velocity: Vector3 = [
    k2 *
      (eSinTheta * modifiedState.position[0] +
        rhoVal * modifiedState.velocity[0]),
    k2 *
      (eSinTheta * modifiedState.position[1] +
        rhoVal * modifiedState.velocity[1]),
    k2 *
      (eSinTheta * modifiedState.position[2] +
        rhoVal * modifiedState.velocity[2]),
  ];

  return { position, velocity };
};

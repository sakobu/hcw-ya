/**
 * In-plane (X-Z) state transition matrix for the Yamanaka-Ankersen propagation.
 *
 * Reference: Yamanaka-Ankersen (2002), Eqs. (80)-(83).
 */

import type { InPlaneState, TrueAnomaly } from "@/types";
import { c, cPrime, rho, s, sPrime } from "@/auxiliary-functions";

/**
 * Compute the pseudo-initial in-plane state used by the YA in-plane STM.
 *
 * Reference: Yamanaka-Ankersen (2002). Uses the inverse transformation matrix (Eq. (80))
 * to construct the pseudo-initial vector defined in Eq. (82), so that propagation by
 * Eq. (83) is affine-free.
 *
 * @param state - In-plane components (x, z, vx, vz) in modified coordinates
 * @param e - Eccentricity e in [0, 1)
 * @param theta0 - Initial true anomaly theta0 [rad]
 * @returns Pseudo-initial in-plane state
 */
export const computePseudoInitialInPlane = (
  state: InPlaneState,
  e: number,
  theta0: TrueAnomaly
): InPlaneState => {
  const rho0 = rho(e, theta0);
  const s0 = s(e, theta0);
  const c0 = c(e, theta0);

  const oneMinusE2 = 1 - e * e;
  const factor = 1 / oneMinusE2;

  const xBar =
    factor *
    ((1 - e * e) * state.x +
      3 * e * (s0 / rho0) * (1 + 1 / rho0) * state.z +
      -e * s0 * (1 + 1 / rho0) * state.vx +
      (-e * c0 + 2) * state.vz);

  const zBar =
    factor *
    (0 +
      -3 * (s0 / rho0) * (1 + (e * e) / rho0) * state.z +
      s0 * (1 + 1 / rho0) * state.vx +
      (c0 - 2 * e) * state.vz);

  const vxBar =
    factor *
    (0 +
      -3 * (c0 / rho0 + e) * state.z +
      (c0 * (1 + 1 / rho0) + e) * state.vx +
      -s0 * state.vz);

  const vzBar =
    factor *
    (0 +
      (3 * rho0 + e * e - 1) * state.z +
      -rho0 * rho0 * state.vx +
      e * s0 * state.vz);

  return { x: xBar, z: zBar, vx: vxBar, vz: vzBar };
};

/**
 * Propagate the in-plane (x-z) motion using the YA state transition matrix.
 *
 * Reference: Yamanaka-Ankersen (2002), Eq. (83). Uses auxiliary terms rho, s, c, s', c'
 * and J to evolve the pseudo-initial state to the final true anomaly.
 *
 * @param pseudoInitial - Pseudo-initial in-plane state (from Eq. (82))
 * @param e - Eccentricity e in [0, 1)
 * @param theta - Final true anomaly theta [rad]
 * @param JValue - J(theta) scalar (Eq. (47)), dimensionless
 * @returns Final in-plane state in modified coordinates
 */
export const propagateInPlane = (
  pseudoInitial: InPlaneState,
  e: number,
  theta: TrueAnomaly,
  JValue: number
): InPlaneState => {
  const rhoVal = rho(e, theta);
  const sVal = s(e, theta);
  const cVal = c(e, theta);
  const sPrimeVal = sPrime(e, theta);
  const cPrimeVal = cPrime(e, theta);

  const oneOverRho = 1 / rhoVal;

  const x =
    1 * pseudoInitial.x +
    -cVal * (1 + oneOverRho) * pseudoInitial.z +
    sVal * (1 + oneOverRho) * pseudoInitial.vx +
    3 * rhoVal * rhoVal * JValue * pseudoInitial.vz;

  const z =
    0 * pseudoInitial.x +
    sVal * pseudoInitial.z +
    cVal * pseudoInitial.vx +
    (2 - 3 * e * sVal * JValue) * pseudoInitial.vz;

  const vx =
    0 * pseudoInitial.x +
    2 * sVal * pseudoInitial.z +
    (2 * cVal - e) * pseudoInitial.vx +
    3 * (1 - 2 * e * sVal * JValue) * pseudoInitial.vz;

  const vz =
    0 * pseudoInitial.x +
    sPrimeVal * pseudoInitial.z +
    cPrimeVal * pseudoInitial.vx +
    -3 * e * (sPrimeVal * JValue + sVal / (rhoVal * rhoVal)) * pseudoInitial.vz;

  return { x, z, vx, vz };
};

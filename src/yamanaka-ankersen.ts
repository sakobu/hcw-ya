/**
 * Yamanaka-Ankersen State Transition Matrix for Relative Motion on Elliptical Orbits
 *
 * This implements the analytical solution from:
 * "New State Transition Matrix for Relative Motion on an Arbitrary Elliptical Orbit"
 * Journal of Guidance, Control, and Dynamics, Vol. 25, No. 1, January-February 2002
 */

import type {
  Frame,
  InPlaneState,
  OrbitalElements,
  OutOfPlaneState,
  RelativeState,
  TrueAnomaly,
} from "@/types";
import { J } from "@/auxiliary-functions";
import {
  fromModifiedCoordinates,
  toModifiedCoordinates,
} from "@/coordinate-transforms";
import { fromInternalToFrame, toInternalFromFrame } from "@/frames";
import { computePseudoInitialInPlane, propagateInPlane } from "@/in-plane-stm";
import { propagateOutOfPlane } from "@/out-of-plane-stm";

/**
 * Propagate a relative state across an elliptic orbit using the Yamanaka-Ankersen STM.
 *
 * Algorithm outline (following the paper):
 * 1) Transform the true state to modified coordinates (YA modified variables)
 * 2) Compute the pseudo-initial in-plane state (Eq. (82))
 * 3) Propagate in-plane via Eq. (83) and out-of-plane via Eq. (84)
 * 4) Combine components and transform back to true coordinates
 *
 * Reference: Yamanaka-Ankersen (2002), Eqs. (47), (82)-(84) and accompanying text.
 *
 * @param initialState - Relative state in true coordinates; position [m], velocity [m/s]
 * @param elements - Orbital elements providing e, mu, h (e in [0,1))
 * @param theta0 - Initial true anomaly theta0 [rad]
 * @param thetaF - Final true anomaly theta [rad]
 * @param deltaTime - Time difference (t - t0) [s]
 * @param frame - Interpret input as [R, I, C] in this frame and return output in the same frame
 * @returns Final relative state at theta = thetaF in the provided frame
 * @throws Error if e not in [0, 1)
 */
export const propagateYA = (
  initialState: RelativeState,
  elements: OrbitalElements,
  theta0: TrueAnomaly,
  thetaF: TrueAnomaly,
  deltaTime: number,
  frame: Frame
): RelativeState => {
  const e = elements.eccentricity;

  // Validate eccentricity
  if (e < 0 || e >= 1) {
    throw new Error(`Eccentricity must be in range [0, 1), got ${e}`);
  }

  // Map input frame to internal ordering if requested
  const internalInitial = toInternalFromFrame(initialState, frame);

  // Transform to modified coordinates at initial time
  const modifiedInitial = toModifiedCoordinates(
    internalInitial,
    elements,
    theta0
  );

  // Compute J value
  const JValue = J(elements, deltaTime);

  // Propagate in-plane motion
  const inPlaneInitial: InPlaneState = {
    x: modifiedInitial.position[0],
    z: modifiedInitial.position[2],
    vx: modifiedInitial.velocity[0],
    vz: modifiedInitial.velocity[2],
  };

  const pseudoInPlane = computePseudoInitialInPlane(inPlaneInitial, e, theta0);
  const finalInPlane = propagateInPlane(pseudoInPlane, e, thetaF, JValue);

  // Propagate out-of-plane motion
  const outOfPlaneInitial: OutOfPlaneState = {
    y: modifiedInitial.position[1],
    vy: modifiedInitial.velocity[1],
  };

  const finalOutOfPlane = propagateOutOfPlane(
    outOfPlaneInitial,
    e,
    theta0,
    thetaF
  );

  // Combine results in modified coordinates
  const modifiedFinal: RelativeState = {
    position: [finalInPlane.x, finalOutOfPlane.y, finalInPlane.z],
    velocity: [finalInPlane.vx, finalOutOfPlane.vy, finalInPlane.vz],
  };

  // Transform back to true coordinates (internal ordering)
  const finalTrueInternal = fromModifiedCoordinates(
    modifiedFinal,
    elements,
    thetaF
  );

  return fromInternalToFrame(finalTrueInternal, frame);
};

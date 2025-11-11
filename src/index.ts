/**
 * Yamanaka-Ankersen State Transition Matrix for Relative Motion on Elliptical Orbits
 *
 * Public API for the implementation from:
 * "New State Transition Matrix for Relative Motion on an Arbitrary Elliptical Orbit"
 * Journal of Guidance, Control, and Dynamics, Vol. 25, No. 1, January-February 2002
 */

// Type exports
export type {
  Vector3,
  RelativeState,
  OrbitalElements,
  TrueAnomaly,
  InPlaneState,
  OutOfPlaneState,
  Frame,
  DeriveAngularMomentum,
} from "@/types";

// Main propagation functions
export { propagateYA } from "@/yamanaka-ankersen";
export { propagateHCW } from "@/clohessy-wiltshire";

// Coordinate transformations
export {
  toModifiedCoordinates,
  fromModifiedCoordinates,
} from "@/coordinate-transforms";

// Kepler utilities
export {
  trueAnomalyFromMean,
  trueAnomalyAtTime,
  orbitalPeriod,
  deriveAngularMomentum,
} from "@/kepler-utils";

// Auxiliary functions (for advanced users)
export { kSquared, rho, s, c, sPrime, cPrime, J } from "@/auxiliary-functions";

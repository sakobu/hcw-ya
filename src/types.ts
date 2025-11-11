/**
 * Type definitions for the Yamanaka-Ankersen State Transition Matrix implementation.
 *
 * Reference: "New State Transition Matrix for Relative Motion on an Arbitrary Elliptical Orbit"
 * Journal of Guidance, Control, and Dynamics, Vol. 25, No. 1, January-February 2002
 */

export type Vector3 = readonly [number, number, number];

export type RelativeState = {
  readonly position: Vector3; // [x, y, z] in meters
  readonly velocity: Vector3; // [vx, vy, vz] in m/s
};

export type OrbitalElements = {
  readonly eccentricity: number; // e (0 <= e < 1)
  readonly angularMomentum: number; // h in m^2/s
  readonly gravitationalParameter: number; // mu in m^3/s^2 (e.g., 3.986004418e14 for Earth)
};

export type TrueAnomaly = number; // theta in radians

export type Frame = "RIC" | "LVLH";

export type InPlaneState = {
  readonly x: number;
  readonly z: number;
  readonly vx: number;
  readonly vz: number;
};

export type OutOfPlaneState = {
  readonly y: number;
  readonly vy: number;
};

export type DeriveAngularMomentum = (
  eccentricity: number, // e (0 <= e < 1)
  meanMotionRevPerDay: number, // n in rev/day (from TLE MEAN_MOTION)
  mu: number // gravitational parameter in m^3/s^2 (e.g., 3.986004418e14 for Earth)
) => number; // returns h in m^2/s

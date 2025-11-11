/**
 * Auxiliary mathematical functions for the Yamanaka-Ankersen State Transition Matrix.
 *
 * Reference: Yamanaka-Ankersen (2002), New State Transition Matrix for Relative Motion on an
 * Arbitrary Elliptical Orbit, JGCD 25(1).
 */

import type { OrbitalElements, TrueAnomaly } from "@/types";

/**
 * Compute the auxiliary scalar rho(theta) = 1 + e*cos(theta).
 *
 * Reference: Yamanaka-Ankersen (2002), New State Transition Matrix for Relative Motion on an
 * Arbitrary Elliptical Orbit, JGCD 25(1). rho appears throughout the modified-coordinate
 * formulation and in the state transition matrices (e.g., Eq. (25) via omega = k^2*rho^2).
 *
 * @param e - Eccentricity e in [0, 1)
 * @param theta - True anomaly theta [rad]
 * @returns rho(theta) (dimensionless)
 */
export const rho = (e: number, theta: TrueAnomaly): number =>
  1 + e * Math.cos(theta);

/**
 * Compute s(theta) = rho(theta)*sin(theta), an auxiliary term used by the in-plane STM.
 *
 * Reference: Yamanaka-Ankersen (2002). s and c are convenient shorthands that compactly
 * express the in-plane transition relations (see Eq. (83)).
 *
 * @param e - Eccentricity e in [0, 1)
 * @param theta - True anomaly theta [rad]
 * @returns s(theta) (dimensionless)
 */
export const s = (e: number, theta: TrueAnomaly): number => {
  const rhoVal = rho(e, theta);
  return rhoVal * Math.sin(theta);
};

/**
 * Compute c(theta) = rho(theta)*cos(theta), an auxiliary term used by the in-plane STM.
 *
 * Reference: Yamanaka-Ankersen (2002). s and c are convenient shorthands that compactly
 * express the in-plane transition relations (see Eq. (83)).
 *
 * @param e - Eccentricity e in [0, 1)
 * @param theta - True anomaly theta [rad]
 * @returns c(theta) (dimensionless)
 */
export const c = (e: number, theta: TrueAnomaly): number => {
  const rhoVal = rho(e, theta);
  return rhoVal * Math.cos(theta);
};

/**
 * Compute s'(theta) = cos(theta) + e*cos(2*theta).
 *
 * Reference: Yamanaka-Ankersen (2002). s' and c' appear in the in-plane STM (Eq. (83))
 * as derivatives of auxiliary trigonometric combinations.
 *
 * @param e - Eccentricity e in [0, 1)
 * @param theta - True anomaly theta [rad]
 * @returns s'(theta) (dimensionless)
 */
export const sPrime = (e: number, theta: TrueAnomaly): number =>
  Math.cos(theta) + e * Math.cos(2 * theta);

/**
 * Compute c'(theta) = -(sin(theta) + e*sin(2*theta)).
 *
 * Reference: Yamanaka-Ankersen (2002). s' and c' appear in the in-plane STM (Eq. (83))
 * as derivatives of auxiliary trigonometric combinations.
 *
 * @param e - Eccentricity e in [0, 1)
 * @param theta - True anomaly theta [rad]
 * @returns c'(theta) (dimensionless)
 */
export const cPrime = (e: number, theta: TrueAnomaly): number =>
  -(Math.sin(theta) + e * Math.sin(2 * theta));

/**
 * Compute k^2 where k is defined as mu / h^(3/2) and thus k^2 = (mu / h^(3/2))^2.
 *
 * Reference: Yamanaka-Ankersen (2002):
 * - Eq. (14): definition of k
 * - Eq. (25): omega = k^2*rho^2
 * - Eq. (47): J(theta) = k^2*(t - t0)
 *
 * Units: k has units s^(-1/2); therefore k^2 has units s^(-1).
 *
 * @param elements - Orbital elements providing mu and h
 * @returns k^2 [s^(-1)]
 */
export const kSquared = (elements: OrbitalElements): number => {
  const { gravitationalParameter: mu, angularMomentum: h } = elements;
  const k = mu / Math.pow(h, 1.5);
  return k * k; // Return k^2, not k
};

/**
 * Compute the Yamanaka-Ankersen scalar J via J(theta) = k^2*(t - t0).
 *
 * Reference: Yamanaka-Ankersen (2002), Eq. (47). The paper shows that the integral
 * J(theta) = integral from theta0 to theta of rho(tau)^(-2) differential tau equals k^2*(t - t0),
 * allowing time-domain propagation without directly evaluating the integral.
 *
 * @param elements - Orbital elements providing mu and h
 * @param deltaTime - Time difference (t - t0) [s]
 * @returns J (dimensionless)
 */
export const J = (elements: OrbitalElements, deltaTime: number): number =>
  kSquared(elements) * deltaTime;

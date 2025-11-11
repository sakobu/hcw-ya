/**
 * Keplerian orbital mechanics utilities.
 *
 * Note: These helpers are not from Yamanaka-Ankersen; they are provided for convenience
 * when applying the YA STM over time by converting between anomalies and computing orbital periods.
 */

import type {
  OrbitalElements,
  TrueAnomaly,
  DeriveAngularMomentum,
} from "@/types";

/**
 * Solve Kepler's equation to obtain true anomaly from mean anomaly.
 *
 * Note: This helper is not from Yamanaka-Ankersen; it is provided for convenience
 * when applying the YA STM over time by converting between anomalies.
 *
 * @param meanAnomaly - Mean anomaly M [rad]
 * @param eccentricity - Eccentricity e in [0, 1)
 * @param tolerance - Convergence tolerance on E (default 1e-10)
 * @returns True anomaly theta corresponding to M [rad]
 */
export const trueAnomalyFromMean = (
  meanAnomaly: number,
  eccentricity: number,
  tolerance: number = 1e-10
): TrueAnomaly => {
  // First solve Kepler's equation for eccentric anomaly
  let E = meanAnomaly; // Initial guess

  for (let i = 0; i < 100; i++) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly;
    const fPrime = 1 - eccentricity * Math.cos(E);
    const deltaE = f / fPrime;
    E -= deltaE;

    if (Math.abs(deltaE) < tolerance) break;
  }

  // Convert eccentric anomaly to true anomaly
  const theta =
    2 *
    Math.atan(
      Math.sqrt((1 + eccentricity) / (1 - eccentricity)) * Math.tan(E / 2)
    );

  return theta;
};

/**
 * Compute true anomaly at time t0 + dt given theta0 via Kepler propagation.
 *
 * Note: This helper is not from Yamanaka-Ankersen; it is provided for convenience
 * to advance theta when using the YA STM.
 *
 * @param elements - Orbital elements providing e, mu, h
 * @param theta0 - Initial true anomaly theta0 [rad]
 * @param deltaTime - Time difference dt [s]
 * @returns True anomaly theta at t0 + dt [rad]
 */
export const trueAnomalyAtTime = (
  elements: OrbitalElements,
  theta0: TrueAnomaly,
  deltaTime: number
): TrueAnomaly => {
  const {
    eccentricity: e,
    angularMomentum: h,
    gravitationalParameter: mu,
  } = elements;

  // Compute semi-major axis
  const a = (h * h) / (mu * (1 - e * e));

  // Mean motion
  const n = Math.sqrt(mu / (a * a * a));

  // Convert initial true anomaly to eccentric anomaly
  const E0 = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(theta0 / 2));

  // Initial mean anomaly
  const M0 = E0 - e * Math.sin(E0);

  // Mean anomaly at final time
  const Mf = M0 + n * deltaTime;

  // Solve for final true anomaly
  return trueAnomalyFromMean(Mf, e);
};

/**
 * Compute the orbital period for the given elements.
 *
 * Note: This helper is not from Yamanaka-Ankersen; it is provided for convenience
 * when planning propagation intervals.
 *
 * @param elements - Orbital elements providing e, mu, h
 * @returns Orbital period T [s]
 */
export const orbitalPeriod = (elements: OrbitalElements): number => {
  const {
    angularMomentum: h,
    gravitationalParameter: mu,
    eccentricity: e,
  } = elements;
  const a = (h * h) / (mu * (1 - e * e)); // Semi-major axis
  return 2 * Math.PI * Math.sqrt((a * a * a) / mu);
};

/**
 * Derive specific angular momentum from TLE mean motion and eccentricity.
 *
 * Note: This helper is not from Yamanaka-Ankersen; it is provided for convenience
 * when constructing OrbitalElements from TLE data. TLE mean motion is an SGP4 "mean" value
 * (J2-perturbed). This closed-form conversion is suitable for Keplerian helpers and quick
 * estimates. For high-precision propagation directly from TLEs, prefer an SGP4 implementation.
 *
 * @param eccentricity - Eccentricity e in [0, 1) from TLE ECCENTRICITY
 * @param meanMotionRevPerDay - Mean motion n in rev/day from TLE MEAN_MOTION
 * @param mu - Gravitational parameter in m^3/s^2 (e.g., 3.986004418e14 for Earth)
 * @returns Specific angular momentum h [m^2/s]
 */
export const deriveAngularMomentum: DeriveAngularMomentum = (
  eccentricity: number,
  meanMotionRevPerDay: number,
  mu: number
): number => {
  if (!(eccentricity >= 0 && eccentricity < 1)) {
    throw new Error("eccentricity must be in [0,1).");
  }
  if (!(meanMotionRevPerDay > 0)) {
    throw new Error("meanMotionRevPerDay must be > 0.");
  }

  const nRadPerSec = (meanMotionRevPerDay * 2 * Math.PI) / 86400; // rad/s
  const a = Math.cbrt(mu / (nRadPerSec * nRadPerSec)); // m
  return Math.sqrt(mu * a * (1 - eccentricity * eccentricity)); // m^2/s
};

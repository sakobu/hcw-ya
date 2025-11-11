/**
 * Unit tests for Keplerian orbital mechanics utilities.
 */

import { describe, test, expect } from "bun:test";
import {
  trueAnomalyFromMean,
  trueAnomalyAtTime,
  orbitalPeriod,
  deriveAngularMomentum,
} from "@/kepler-utils";
import type { OrbitalElements } from "@/types";

describe("kepler-utils", () => {
  const earthElements: OrbitalElements = {
    eccentricity: 0.1,
    gravitationalParameter: 3.986004418e14, // Earth mu [m^3/s^2]
    angularMomentum: 5e10, // [m^2/s]
  };

  describe("trueAnomalyFromMean", () => {
    test("circular orbit: true anomaly equals mean anomaly", () => {
      const e = 0;
      const meanAnomaly = Math.PI / 4;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      expect(theta).toBeCloseTo(meanAnomaly);
    });

    test("converts mean anomaly M=0 to true anomaly theta=0", () => {
      const e = 0.3;
      const meanAnomaly = 0;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      expect(theta).toBeCloseTo(0);
    });

    test("converts mean anomaly M=pi to true anomaly theta=pi", () => {
      const e = 0.3;
      const meanAnomaly = Math.PI;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      expect(theta).toBeCloseTo(Math.PI, 5);
    });

    test("eccentric orbit with e=0.5", () => {
      const e = 0.5;
      const meanAnomaly = Math.PI / 2;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      // For e=0.5, M=pi/2, we expect theta > M
      expect(theta).toBeGreaterThan(meanAnomaly);
      expect(isFinite(theta)).toBe(true);
    });

    test("high eccentricity e=0.9", () => {
      const e = 0.9;
      const meanAnomaly = Math.PI / 4;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      expect(isFinite(theta)).toBe(true);
      expect(theta).toBeGreaterThan(0);
    });

    test("multiple mean anomalies for circular orbit", () => {
      const e = 0;
      const meanAnomalies = [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI];

      for (const M of meanAnomalies) {
        const theta = trueAnomalyFromMean(M, e);
        expect(theta).toBeCloseTo(M);
      }
    });

    test("converges with custom tolerance", () => {
      const e = 0.3;
      const meanAnomaly = Math.PI / 3;
      const tolerance = 1e-12;

      const theta = trueAnomalyFromMean(meanAnomaly, e, tolerance);

      expect(isFinite(theta)).toBe(true);
    });

    test("handles mean anomaly > 2pi", () => {
      const e = 0.2;
      const meanAnomaly = 3 * Math.PI;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      expect(isFinite(theta)).toBe(true);
    });

    test("handles negative mean anomaly", () => {
      const e = 0.3;
      const meanAnomaly = -Math.PI / 4;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      expect(isFinite(theta)).toBe(true);
      expect(theta).toBeLessThan(0);
    });

    test("verification: E - e*sin(E) = M", () => {
      const e = 0.4;
      const meanAnomaly = Math.PI / 3;

      const theta = trueAnomalyFromMean(meanAnomaly, e);

      // Convert back to eccentric anomaly
      const E =
        2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(theta / 2));

      // Verify Kepler's equation
      const computedM = E - e * Math.sin(E);
      expect(computedM).toBeCloseTo(meanAnomaly, 8);
    });
  });

  describe("trueAnomalyAtTime", () => {
    test("circular orbit: theta advances linearly with time", () => {
      const circularElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 0,
      };
      const theta0 = 0;

      // Compute orbital period
      const period = orbitalPeriod(circularElements);

      // Advance by 1/4 period
      const deltaTime = period / 4;
      const theta = trueAnomalyAtTime(circularElements, theta0, deltaTime);

      // Should advance by pi/2
      expect(theta).toBeCloseTo(Math.PI / 2, 5);
    });

    test("zero time returns initial theta", () => {
      const theta0 = Math.PI / 4;
      const deltaTime = 0;

      const theta = trueAnomalyAtTime(earthElements, theta0, deltaTime);

      expect(theta).toBeCloseTo(theta0);
    });

    test("one full period returns to initial theta (circular)", () => {
      const circularElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 0,
      };
      const theta0 = Math.PI / 6;
      const period = orbitalPeriod(circularElements);

      const theta = trueAnomalyAtTime(circularElements, theta0, period);

      // Should wrap back to initial (modulo 2pi)
      const diff = Math.abs(theta - theta0);
      const wrappedDiff = Math.min(diff, 2 * Math.PI - diff);
      expect(wrappedDiff).toBeCloseTo(0, 4);
    });

    test("eccentric orbit propagation", () => {
      const theta0 = 0;
      const deltaTime = 1000; // seconds

      const theta = trueAnomalyAtTime(earthElements, theta0, deltaTime);

      expect(isFinite(theta)).toBe(true);
      expect(theta).toBeGreaterThan(0);
    });

    test("backward propagation (negative time)", () => {
      const theta0 = Math.PI / 2;
      const deltaTime = -500;

      const theta = trueAnomalyAtTime(earthElements, theta0, deltaTime);

      expect(isFinite(theta)).toBe(true);
      expect(theta).toBeLessThan(theta0);
    });

    test("high eccentricity propagation", () => {
      const highEccElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 0.85,
      };
      const theta0 = Math.PI / 4;
      const deltaTime = 2000;

      const theta = trueAnomalyAtTime(highEccElements, theta0, deltaTime);

      expect(isFinite(theta)).toBe(true);
    });

    test("propagation from various starting anomalies", () => {
      const deltaTime = 500;
      const startingThetas = [
        0,
        Math.PI / 6,
        Math.PI / 4,
        Math.PI / 2,
        Math.PI,
      ];

      for (const theta0 of startingThetas) {
        const theta = trueAnomalyAtTime(earthElements, theta0, deltaTime);
        expect(isFinite(theta)).toBe(true);
      }
    });

    test("consistency: advancing then reversing returns to start", () => {
      const theta0 = Math.PI / 3;
      const deltaTime = 800;

      const thetaForward = trueAnomalyAtTime(earthElements, theta0, deltaTime);
      const thetaBack = trueAnomalyAtTime(
        earthElements,
        thetaForward,
        -deltaTime
      );

      expect(thetaBack).toBeCloseTo(theta0, 5);
    });
  });

  describe("orbitalPeriod", () => {
    test("computes orbital period for circular orbit", () => {
      const circularElements: OrbitalElements = {
        eccentricity: 0,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 5e10,
      };

      const period = orbitalPeriod(circularElements);

      expect(period).toBeGreaterThan(0);
      expect(isFinite(period)).toBe(true);
    });

    test("computes orbital period for eccentric orbit", () => {
      const period = orbitalPeriod(earthElements);

      expect(period).toBeGreaterThan(0);
      expect(isFinite(period)).toBe(true);
    });

    test("period increases with larger semi-major axis", () => {
      const smallOrbit: OrbitalElements = {
        eccentricity: 0.1,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 3e10, // smaller h -> smaller a
      };

      const largeOrbit: OrbitalElements = {
        eccentricity: 0.1,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 8e10, // larger h -> larger a
      };

      const periodSmall = orbitalPeriod(smallOrbit);
      const periodLarge = orbitalPeriod(largeOrbit);

      expect(periodLarge).toBeGreaterThan(periodSmall);
    });

    test("period is independent of eccentricity for same semi-major axis", () => {
      // For same h and different e, if we want same a, we need to adjust h
      // But with same a and mu, period should be the same regardless of e
      // Let's test that the formula works correctly

      // Semi-major axis: a = h^2/(mu(1-e^2))
      // For circular: a = h^2/mu
      // For eccentric with same a: h^2 = mu*a*(1-e^2)

      const mu = 3.986004418e14;
      const a = 7e6; // meters (semi-major axis)

      const circularH = Math.sqrt(mu * a);
      const e = 0.3;
      const eccentricH = Math.sqrt(mu * a * (1 - e * e));

      const circularElements: OrbitalElements = {
        eccentricity: 0,
        gravitationalParameter: mu,
        angularMomentum: circularH,
      };

      const eccentricElements: OrbitalElements = {
        eccentricity: e,
        gravitationalParameter: mu,
        angularMomentum: eccentricH,
      };

      const periodCircular = orbitalPeriod(circularElements);
      const periodEccentric = orbitalPeriod(eccentricElements);

      // Both should have the same period
      expect(periodEccentric).toBeCloseTo(periodCircular, 5);
    });

    test("verification: period matches Kepler's third law", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.2,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 6e10,
      };

      const period = orbitalPeriod(elements);

      // Compute semi-major axis from h
      const {
        angularMomentum: h,
        gravitationalParameter: mu,
        eccentricity: e,
      } = elements;
      const a = (h * h) / (mu * (1 - e * e));

      // Kepler's third law: T = 2*pi*sqrt(a^3/mu)
      const expectedPeriod = 2 * Math.PI * Math.sqrt((a * a * a) / mu);

      expect(period).toBeCloseTo(expectedPeriod);
    });

    test("typical LEO orbit period", () => {
      // Low Earth Orbit: altitude ~400km, radius ~6800km
      const mu = 3.986004418e14;
      const r = 6.8e6; // meters
      const v = Math.sqrt(mu / r); // circular velocity
      const h = r * v;

      const leoElements: OrbitalElements = {
        eccentricity: 0,
        gravitationalParameter: mu,
        angularMomentum: h,
      };

      const period = orbitalPeriod(leoElements);

      // LEO period should be around 90-95 minutes
      const periodMinutes = period / 60;
      expect(periodMinutes).toBeGreaterThan(80);
      expect(periodMinutes).toBeLessThan(100);
    });

    test("various eccentricities with different angular momenta", () => {
      const eccentricities = [0, 0.1, 0.3, 0.5, 0.7, 0.9];

      for (const e of eccentricities) {
        const elements: OrbitalElements = {
          eccentricity: e,
          gravitationalParameter: 3.986004418e14,
          angularMomentum: 5e10,
        };

        const period = orbitalPeriod(elements);

        expect(period).toBeGreaterThan(0);
        expect(isFinite(period)).toBe(true);
      }
    });
  });

  describe("deriveAngularMomentum", () => {
    const mu = 3.986004418e14; // Earth mu [m^3/s^2]

    test("derives h from TLE CALSPHERE 1 (circular-ish LEO)", () => {
      const e = 0.0023897;
      const meanMotionRevPerDay = 13.7624787;

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, mu);

      // Expected: h ~5.41e10 m^2/s
      expect(h).toBeCloseTo(5.41e10, -8);
      expect(h).toBeGreaterThan(0);
    });

    test("derives h from typical LEO orbit (300km x 1782km, e=0.1)", () => {
      const e = 0.1;
      const meanMotionRevPerDay = 13.7624787; // ~6363 s period

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, mu);

      expect(h).toBeGreaterThan(0);
      expect(isFinite(h)).toBe(true);
    });

    test("circular orbit: e=0", () => {
      const e = 0;
      const meanMotionRevPerDay = 15.5; // ~93 min period

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, mu);

      expect(h).toBeGreaterThan(0);
      expect(isFinite(h)).toBe(true);
    });

    test("high eccentricity orbit: e=0.85", () => {
      const e = 0.85;
      const meanMotionRevPerDay = 10.0;

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, mu);

      expect(h).toBeGreaterThan(0);
      expect(isFinite(h)).toBe(true);
    });

    test("throws for invalid eccentricity e >= 1", () => {
      const e = 1.0;
      const meanMotionRevPerDay = 13.0;

      expect(() => deriveAngularMomentum(e, meanMotionRevPerDay, mu)).toThrow(
        "eccentricity must be in [0,1)."
      );
    });

    test("throws for negative eccentricity", () => {
      const e = -0.1;
      const meanMotionRevPerDay = 13.0;

      expect(() => deriveAngularMomentum(e, meanMotionRevPerDay, mu)).toThrow(
        "eccentricity must be in [0,1)."
      );
    });

    test("throws for zero mean motion", () => {
      const e = 0.1;
      const meanMotionRevPerDay = 0;

      expect(() => deriveAngularMomentum(e, meanMotionRevPerDay, mu)).toThrow(
        "meanMotionRevPerDay must be > 0."
      );
    });

    test("throws for negative mean motion", () => {
      const e = 0.1;
      const meanMotionRevPerDay = -5;

      expect(() => deriveAngularMomentum(e, meanMotionRevPerDay, mu)).toThrow(
        "meanMotionRevPerDay must be > 0."
      );
    });

    test("verification: derived h produces correct orbital period", () => {
      const e = 0.1;
      const meanMotionRevPerDay = 13.7624787;

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, mu);

      const elements: OrbitalElements = {
        eccentricity: e,
        gravitationalParameter: mu,
        angularMomentum: h,
      };

      const period = orbitalPeriod(elements);
      const expectedPeriod = 86400 / meanMotionRevPerDay; // seconds

      expect(period).toBeCloseTo(expectedPeriod, 1);
    });

    test("verification: semi-major axis from mean motion formula", () => {
      const e = 0.05;
      const meanMotionRevPerDay = 14.0;

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, mu);

      // Compute semi-major axis from h
      const a = (h * h) / (mu * (1 - e * e));

      // Compute expected a from mean motion: n = sqrt(mu/a^3)
      const nRadPerSec = (meanMotionRevPerDay * 2 * Math.PI) / 86400;
      const expectedA = Math.cbrt(mu / (nRadPerSec * nRadPerSec));

      expect(a).toBeCloseTo(expectedA, 1);
    });

    test("different gravitational parameters (Mars)", () => {
      const muMars = 4.282837e13; // m^3/s^2
      const e = 0.05;
      const meanMotionRevPerDay = 12.0;

      const h = deriveAngularMomentum(e, meanMotionRevPerDay, muMars);

      expect(h).toBeGreaterThan(0);
      expect(isFinite(h)).toBe(true);

      // Verify it's smaller than Earth's for same n (Mars has lower mu)
      const hEarth = deriveAngularMomentum(e, meanMotionRevPerDay, mu);
      expect(h).toBeLessThan(hEarth);
    });

    test("range of typical TLE mean motions", () => {
      const meanMotions = [11.0, 13.0, 14.0, 15.0, 16.0]; // rev/day
      const e = 0.001;

      for (const n of meanMotions) {
        const h = deriveAngularMomentum(e, n, mu);
        expect(h).toBeGreaterThan(0);
        expect(isFinite(h)).toBe(true);
      }
    });

    test("consistency: higher mean motion yields lower h (lower orbit)", () => {
      const e = 0.01;
      const lowN = 12.0;
      const highN = 16.0;

      const hLow = deriveAngularMomentum(e, lowN, mu);
      const hHigh = deriveAngularMomentum(e, highN, mu);

      // Higher mean motion = faster orbit = lower altitude = lower h
      expect(hHigh).toBeLessThan(hLow);
    });
  });

  describe("integration tests", () => {
    test("propagate one full period using trueAnomalyAtTime", () => {
      const circularElements: OrbitalElements = {
        eccentricity: 0,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 5e10,
      };

      const theta0 = Math.PI / 4;
      const period = orbitalPeriod(circularElements);

      const thetaFinal = trueAnomalyAtTime(circularElements, theta0, period);

      // Should return to approximately the same anomaly (within numerical precision)
      const diff = Math.abs(thetaFinal - theta0);
      const wrappedDiff = Math.min(diff, 2 * Math.PI - diff);
      expect(wrappedDiff).toBeLessThan(0.01); // Small tolerance for numerical errors
    });

    test("propagate half period in circular orbit", () => {
      const circularElements: OrbitalElements = {
        eccentricity: 0,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 6e10,
      };

      const theta0 = 0;
      const period = orbitalPeriod(circularElements);

      const thetaHalf = trueAnomalyAtTime(circularElements, theta0, period / 2);

      // After half period, should be at approximately pi
      expect(thetaHalf).toBeCloseTo(Math.PI, 4);
    });

    test("consistency between all three functions", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.2,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 5.5e10,
      };

      const theta0 = Math.PI / 6;
      const period = orbitalPeriod(elements);

      // Advance by 1/8 period
      const deltaTime = period / 8;
      const thetaFinal = trueAnomalyAtTime(elements, theta0, deltaTime);

      // The result should be a valid true anomaly
      expect(isFinite(thetaFinal)).toBe(true);

      // Going backward should return to start
      const thetaBack = trueAnomalyAtTime(elements, thetaFinal, -deltaTime);
      expect(thetaBack).toBeCloseTo(theta0, 5);
    });
  });
});

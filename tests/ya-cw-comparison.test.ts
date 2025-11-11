/**
 * Comparison tests: Yamanaka-Ankersen vs Clohessy-Wiltshire for circular orbits.
 *
 * This test verifies that the YA STM reduces to the CW solution when e = 0,
 * as discussed in Yamanaka-Ankersen (2002) around Eq. (91).
 */

import { describe, test, expect } from "bun:test";
import { propagateYA } from "@/yamanaka-ankersen";
import { propagateHCW } from "@/clohessy-wiltshire";
import type { OrbitalElements, RelativeState, TrueAnomaly } from "@/types";

describe("YA vs CW comparison for circular orbits (e = 0)", () => {
  // Circular orbit parameters
  const mu = 3.986004418e14; // Earth mu [m^3/s^2]
  const h = 5e10; // Angular momentum [m^2/s]
  const e = 0; // Circular orbit

  // For circular orbit: n = mu^2 / h^3
  const n = (mu * mu) / (h * h * h);

  const circularElements: OrbitalElements = {
    eccentricity: e,
    gravitationalParameter: mu,
    angularMomentum: h,
  };

  describe("LVLH frame", () => {
    test("YA reduces to HCW for basic propagation", () => {
      const initialState: RelativeState = {
        position: [100, 200, 300], // LVLH: [I, C, R]
        velocity: [1, 2, 3],
      };

      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      // For circular orbit: theta = n*t, so delta_t = delta_theta / n
      const deltaTime = (thetaF - theta0) / n;

      const resultYA = propagateYA(
        initialState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      const resultHCW = propagateHCW(initialState, n, deltaTime, "LVLH");

      // Position components should match
      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);

      // Velocity components should match
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });

    test("YA reduces to HCW for different true anomaly ranges", () => {
      const initialState: RelativeState = {
        position: [500, 1000, 1500],
        velocity: [5, 10, 15],
      };

      const testCases: [TrueAnomaly, TrueAnomaly][] = [
        [0, Math.PI / 6],
        [Math.PI / 6, Math.PI / 3],
        [Math.PI / 4, Math.PI / 2],
        [0, Math.PI],
      ];

      for (const [theta0, thetaF] of testCases) {
        const deltaTime = (thetaF - theta0) / n;

        const resultYA = propagateYA(
          initialState,
          circularElements,
          theta0,
          thetaF,
          deltaTime,
          "LVLH"
        );

        const resultHCW = propagateHCW(initialState, n, deltaTime, "LVLH");

        expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
        expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
        expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
        expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
        expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
        expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
      }
    });

    test("YA reduces to HCW for zero initial state", () => {
      const zeroState: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };

      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 3;
      const deltaTime = (thetaF - theta0) / n;

      const resultYA = propagateYA(
        zeroState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      const resultHCW = propagateHCW(zeroState, n, deltaTime, "LVLH");

      expect(resultYA.position[0]).toBe(0);
      expect(resultYA.position[1]).toBe(0);
      expect(resultYA.position[2]).toBe(0);
      expect(resultYA.velocity[0]).toBe(0);
      expect(resultYA.velocity[1]).toBe(0);
      expect(resultYA.velocity[2]).toBe(0);

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 10);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 10);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 10);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 10);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 10);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 10);
    });

    test("YA reduces to HCW with zero time (same theta)", () => {
      const initialState: RelativeState = {
        position: [800, 1600, 2400],
        velocity: [8, 16, 24],
      };

      const theta: TrueAnomaly = Math.PI / 4;
      const deltaTime = 0;

      const resultYA = propagateYA(
        initialState,
        circularElements,
        theta,
        theta,
        deltaTime,
        "LVLH"
      );

      const resultHCW = propagateHCW(initialState, n, deltaTime, "LVLH");

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });
  });

  describe("RIC frame", () => {
    test("YA reduces to HCW for basic propagation", () => {
      const initialState: RelativeState = {
        position: [100, 200, 300], // RIC: [R, I, C]
        velocity: [1, 2, 3],
      };

      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = (thetaF - theta0) / n;

      const resultYA = propagateYA(
        initialState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

      const resultHCW = propagateHCW(initialState, n, deltaTime, "RIC");

      // Position components should match
      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);

      // Velocity components should match
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });

    test("YA reduces to HCW for different true anomaly ranges", () => {
      const initialState: RelativeState = {
        position: [400, 800, 1200],
        velocity: [4, 8, 12],
      };

      const testCases: [TrueAnomaly, TrueAnomaly][] = [
        [0, Math.PI / 6],
        [Math.PI / 6, Math.PI / 3],
        [Math.PI / 4, Math.PI / 2],
        [0, Math.PI],
      ];

      for (const [theta0, thetaF] of testCases) {
        const deltaTime = (thetaF - theta0) / n;

        const resultYA = propagateYA(
          initialState,
          circularElements,
          theta0,
          thetaF,
          deltaTime,
          "RIC"
        );

        const resultHCW = propagateHCW(initialState, n, deltaTime, "RIC");

        expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
        expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
        expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
        expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
        expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
        expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
      }
    });

    test("YA reduces to HCW for zero initial state", () => {
      const zeroState: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };

      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 3;
      const deltaTime = (thetaF - theta0) / n;

      const resultYA = propagateYA(
        zeroState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

      const resultHCW = propagateHCW(zeroState, n, deltaTime, "RIC");

      expect(resultYA.position[0]).toBe(0);
      expect(resultYA.position[1]).toBe(0);
      expect(resultYA.position[2]).toBe(0);
      expect(resultYA.velocity[0]).toBe(0);
      expect(resultYA.velocity[1]).toBe(0);
      expect(resultYA.velocity[2]).toBe(0);

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 10);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 10);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 10);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 10);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 10);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 10);
    });

    test("YA reduces to HCW with zero time (same theta)", () => {
      const initialState: RelativeState = {
        position: [600, 1200, 1800],
        velocity: [6, 12, 18],
      };

      const theta: TrueAnomaly = Math.PI / 4;
      const deltaTime = 0;

      const resultYA = propagateYA(
        initialState,
        circularElements,
        theta,
        theta,
        deltaTime,
        "RIC"
      );

      const resultHCW = propagateHCW(initialState, n, deltaTime, "RIC");

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });
  });

  describe("backward propagation", () => {
    test("YA and HCW match for backward propagation in LVLH", () => {
      const initialState: RelativeState = {
        position: [200, 400, 600],
        velocity: [2, 4, 6],
      };

      const theta0: TrueAnomaly = Math.PI / 2;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = (thetaF - theta0) / n; // Negative

      const resultYA = propagateYA(
        initialState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      const resultHCW = propagateHCW(initialState, n, deltaTime, "LVLH");

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });

    test("YA and HCW match for backward propagation in RIC", () => {
      const initialState: RelativeState = {
        position: [300, 600, 900],
        velocity: [3, 6, 9],
      };

      const theta0: TrueAnomaly = Math.PI / 3;
      const thetaF: TrueAnomaly = Math.PI / 6;
      const deltaTime = (thetaF - theta0) / n; // Negative

      const resultYA = propagateYA(
        initialState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

      const resultHCW = propagateHCW(initialState, n, deltaTime, "RIC");

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });
  });

  describe("edge cases", () => {
    test("pure in-plane motion: YA matches HCW", () => {
      const inPlaneState: RelativeState = {
        position: [100, 0, 300], // LVLH: [I, 0, R] - no cross-track
        velocity: [1, 0, 3],
      };

      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = (thetaF - theta0) / n;

      const resultYA = propagateYA(
        inPlaneState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      const resultHCW = propagateHCW(inPlaneState, n, deltaTime, "LVLH");

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });

    test("pure out-of-plane motion: YA matches HCW", () => {
      const outOfPlaneState: RelativeState = {
        position: [0, 200, 0], // LVLH: [0, C, 0] - only cross-track
        velocity: [0, 2, 0],
      };

      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = (thetaF - theta0) / n;

      const resultYA = propagateYA(
        outOfPlaneState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      const resultHCW = propagateHCW(outOfPlaneState, n, deltaTime, "LVLH");

      expect(resultYA.position[0]).toBeCloseTo(resultHCW.position[0], 8);
      expect(resultYA.position[1]).toBeCloseTo(resultHCW.position[1], 8);
      expect(resultYA.position[2]).toBeCloseTo(resultHCW.position[2], 8);
      expect(resultYA.velocity[0]).toBeCloseTo(resultHCW.velocity[0], 8);
      expect(resultYA.velocity[1]).toBeCloseTo(resultHCW.velocity[1], 8);
      expect(resultYA.velocity[2]).toBeCloseTo(resultHCW.velocity[2], 8);
    });
  });
});

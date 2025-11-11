/**
 * Unit tests for in-plane state transition matrix functions.
 */

import { describe, test, expect } from "bun:test";
import { computePseudoInitialInPlane, propagateInPlane } from "@/in-plane-stm";
import type { InPlaneState, TrueAnomaly } from "@/types";

describe("in-plane-stm", () => {
  describe("computePseudoInitialInPlane", () => {
    test("computes pseudo-initial state for circular orbit", () => {
      const state: InPlaneState = {
        x: 100,
        z: 200,
        vx: 1,
        vz: 2,
      };
      const e = 0; // circular
      const theta0: TrueAnomaly = 0;

      const result = computePseudoInitialInPlane(state, e, theta0);

      expect(result.x).toBeDefined();
      expect(result.z).toBeDefined();
      expect(result.vx).toBeDefined();
      expect(result.vz).toBeDefined();
      expect(typeof result.x).toBe("number");
      expect(typeof result.z).toBe("number");
      expect(typeof result.vx).toBe("number");
      expect(typeof result.vz).toBe("number");
    });

    test("computes pseudo-initial state for eccentric orbit", () => {
      const state: InPlaneState = {
        x: 500,
        z: 1000,
        vx: 5,
        vz: 10,
      };
      const e = 0.3;
      const theta0: TrueAnomaly = Math.PI / 4;

      const result = computePseudoInitialInPlane(state, e, theta0);

      expect(result.x).toBeDefined();
      expect(result.z).toBeDefined();
      expect(result.vx).toBeDefined();
      expect(result.vz).toBeDefined();
    });

    test("zero state produces zero pseudo-initial state", () => {
      const zeroState: InPlaneState = {
        x: 0,
        z: 0,
        vx: 0,
        vz: 0,
      };
      const e = 0.2;
      const theta0: TrueAnomaly = Math.PI / 3;

      const result = computePseudoInitialInPlane(zeroState, e, theta0);

      expect(result.x).toBe(0);
      expect(result.z).toBe(0);
      expect(result.vx).toBe(0);
      expect(result.vz).toBe(0);
    });

    test("result values are finite for valid inputs", () => {
      const state: InPlaneState = {
        x: 1000,
        z: 2000,
        vx: 10,
        vz: 20,
      };
      const e = 0.5;
      const theta0: TrueAnomaly = Math.PI / 2;

      const result = computePseudoInitialInPlane(state, e, theta0);

      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.z)).toBe(true);
      expect(isFinite(result.vx)).toBe(true);
      expect(isFinite(result.vz)).toBe(true);
    });

    test("handles various true anomalies", () => {
      const state: InPlaneState = {
        x: 300,
        z: 600,
        vx: 3,
        vz: 6,
      };
      const e = 0.25;
      const testThetas = [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI];

      for (const theta of testThetas) {
        const result = computePseudoInitialInPlane(state, e, theta);

        expect(isFinite(result.x)).toBe(true);
        expect(isFinite(result.z)).toBe(true);
        expect(isFinite(result.vx)).toBe(true);
        expect(isFinite(result.vz)).toBe(true);
      }
    });
  });

  describe("propagateInPlane", () => {
    test("propagates in-plane state for circular orbit", () => {
      const pseudoInitial: InPlaneState = {
        x: 100,
        z: 200,
        vx: 1,
        vz: 2,
      };
      const e = 0; // circular
      const theta: TrueAnomaly = Math.PI / 4;
      const JValue = 0.5;

      const result = propagateInPlane(pseudoInitial, e, theta, JValue);

      expect(result.x).toBeDefined();
      expect(result.z).toBeDefined();
      expect(result.vx).toBeDefined();
      expect(result.vz).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.z)).toBe(true);
      expect(isFinite(result.vx)).toBe(true);
      expect(isFinite(result.vz)).toBe(true);
    });

    test("propagates in-plane state for eccentric orbit", () => {
      const pseudoInitial: InPlaneState = {
        x: 500,
        z: 1000,
        vx: 5,
        vz: 10,
      };
      const e = 0.4;
      const theta: TrueAnomaly = Math.PI / 3;
      const JValue = 1.2;

      const result = propagateInPlane(pseudoInitial, e, theta, JValue);

      expect(result.x).toBeDefined();
      expect(result.z).toBeDefined();
      expect(result.vx).toBeDefined();
      expect(result.vz).toBeDefined();
      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.z)).toBe(true);
      expect(isFinite(result.vx)).toBe(true);
      expect(isFinite(result.vz)).toBe(true);
    });

    test("zero pseudo-initial state with zero J produces zero result", () => {
      const zeroState: InPlaneState = {
        x: 0,
        z: 0,
        vx: 0,
        vz: 0,
      };
      const e = 0.2;
      const theta: TrueAnomaly = Math.PI / 6;
      const JValue = 0;

      const result = propagateInPlane(zeroState, e, theta, JValue);

      expect(result.x).toBe(0);
      expect(result.z).toBe(0);
      expect(result.vx).toBe(0);
      expect(result.vz).toBe(0);
    });

    test("J value affects propagation", () => {
      const pseudoInitial: InPlaneState = {
        x: 100,
        z: 200,
        vx: 1,
        vz: 2,
      };
      const e = 0.3;
      const theta: TrueAnomaly = Math.PI / 4;

      const result1 = propagateInPlane(pseudoInitial, e, theta, 0.5);
      const result2 = propagateInPlane(pseudoInitial, e, theta, 1.0);

      // Results should differ when J differs (unless vz happens to be zero)
      // In general, the x component depends on J via the term 3*rho^2*J*vz
      const xDiffers = Math.abs(result1.x - result2.x) > 1e-10;
      expect(xDiffers).toBe(true);
    });

    test("handles various true anomalies", () => {
      const pseudoInitial: InPlaneState = {
        x: 300,
        z: 600,
        vx: 3,
        vz: 6,
      };
      const e = 0.25;
      const JValue = 0.8;
      const testThetas = [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI];

      for (const theta of testThetas) {
        const result = propagateInPlane(pseudoInitial, e, theta, JValue);

        expect(isFinite(result.x)).toBe(true);
        expect(isFinite(result.z)).toBe(true);
        expect(isFinite(result.vx)).toBe(true);
        expect(isFinite(result.vz)).toBe(true);
      }
    });

    test("handles high eccentricity", () => {
      const pseudoInitial: InPlaneState = {
        x: 800,
        z: 1200,
        vx: 8,
        vz: 12,
      };
      const e = 0.8;
      const theta: TrueAnomaly = Math.PI / 3;
      const JValue = 1.5;

      const result = propagateInPlane(pseudoInitial, e, theta, JValue);

      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.z)).toBe(true);
      expect(isFinite(result.vx)).toBe(true);
      expect(isFinite(result.vz)).toBe(true);
    });

    test("negative J value (backward propagation)", () => {
      const pseudoInitial: InPlaneState = {
        x: 400,
        z: 800,
        vx: 4,
        vz: 8,
      };
      const e = 0.2;
      const theta: TrueAnomaly = Math.PI / 4;
      const JValue = -0.5; // backward

      const result = propagateInPlane(pseudoInitial, e, theta, JValue);

      expect(isFinite(result.x)).toBe(true);
      expect(isFinite(result.z)).toBe(true);
      expect(isFinite(result.vx)).toBe(true);
      expect(isFinite(result.vz)).toBe(true);
    });
  });

  describe("integration tests", () => {
    test("compute pseudo-initial then propagate", () => {
      const initialState: InPlaneState = {
        x: 1000,
        z: 2000,
        vx: 10,
        vz: 20,
      };
      const e = 0.3;
      const theta0: TrueAnomaly = Math.PI / 6;
      const thetaF: TrueAnomaly = Math.PI / 3;
      const JValue = 1.0;

      const pseudoInitial = computePseudoInitialInPlane(
        initialState,
        e,
        theta0
      );
      const finalState = propagateInPlane(pseudoInitial, e, thetaF, JValue);

      expect(isFinite(finalState.x)).toBe(true);
      expect(isFinite(finalState.z)).toBe(true);
      expect(isFinite(finalState.vx)).toBe(true);
      expect(isFinite(finalState.vz)).toBe(true);
    });

    test("propagation from theta=0 to theta=0 with different J", () => {
      const state: InPlaneState = {
        x: 500,
        z: 1000,
        vx: 5,
        vz: 10,
      };
      const e = 0.2;
      const theta0: TrueAnomaly = 0;

      const pseudoInitial = computePseudoInitialInPlane(state, e, theta0);

      // Propagate to same theta but different time (different J)
      const result1 = propagateInPlane(pseudoInitial, e, theta0, 0);
      const result2 = propagateInPlane(pseudoInitial, e, theta0, 1.0);

      // At same theta but different time, states should differ due to J dependence
      const differs = Math.abs(result1.x - result2.x) > 1e-10;
      expect(differs).toBe(true);
    });
  });
});

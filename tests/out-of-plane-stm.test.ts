/**
 * Unit tests for out-of-plane state transition functions.
 */

import { describe, test, expect } from "bun:test";
import { propagateOutOfPlane } from "@/out-of-plane-stm";
import type { OutOfPlaneState, TrueAnomaly } from "@/types";

describe("out-of-plane-stm", () => {
  describe("propagateOutOfPlane", () => {
    test("propagates out-of-plane state for circular orbit", () => {
      const initial: OutOfPlaneState = {
        y: 100,
        vy: 10,
      };
      const e = 0; // circular
      const theta0: TrueAnomaly = 0;
      const theta: TrueAnomaly = Math.PI / 4;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      expect(result.y).toBeDefined();
      expect(result.vy).toBeDefined();
      expect(isFinite(result.y)).toBe(true);
      expect(isFinite(result.vy)).toBe(true);
    });

    test("propagates out-of-plane state for eccentric orbit", () => {
      const initial: OutOfPlaneState = {
        y: 500,
        vy: 50,
      };
      const e = 0.3;
      const theta0: TrueAnomaly = Math.PI / 6;
      const theta: TrueAnomaly = Math.PI / 3;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      expect(result.y).toBeDefined();
      expect(result.vy).toBeDefined();
      expect(isFinite(result.y)).toBe(true);
      expect(isFinite(result.vy)).toBe(true);
    });

    test("zero initial state remains zero for circular orbit", () => {
      const zeroState: OutOfPlaneState = {
        y: 0,
        vy: 0,
      };
      const e = 0;
      const theta0: TrueAnomaly = 0;
      const theta: TrueAnomaly = Math.PI / 2;

      const result = propagateOutOfPlane(zeroState, e, theta0, theta);

      expect(result.y).toBe(0);
      expect(result.vy).toBe(0);
    });

    test("zero initial state remains zero for eccentric orbit", () => {
      const zeroState: OutOfPlaneState = {
        y: 0,
        vy: 0,
      };
      const e = 0.5;
      const theta0: TrueAnomaly = Math.PI / 4;
      const theta: TrueAnomaly = Math.PI / 2;

      const result = propagateOutOfPlane(zeroState, e, theta0, theta);

      expect(result.y).toBe(0);
      expect(result.vy).toBe(0);
    });

    test("propagation with zero delta theta (same anomaly)", () => {
      const initial: OutOfPlaneState = {
        y: 200,
        vy: 20,
      };
      const e = 0.2;
      const theta: TrueAnomaly = Math.PI / 3;

      const result = propagateOutOfPlane(initial, e, theta, theta);

      // At same theta, should rotate by 0, so state should be preserved
      // (modulo the rho factor which is 1 for same theta in circular case)
      expect(result.y).toBeCloseTo(initial.y);
      expect(result.vy).toBeCloseTo(initial.vy);
    });

    test("circular orbit: rotation by delta theta", () => {
      const initial: OutOfPlaneState = {
        y: 100,
        vy: 0,
      };
      const e = 0; // circular, rho=1
      const theta0: TrueAnomaly = 0;
      const deltaTheta = Math.PI / 2;
      const theta: TrueAnomaly = theta0 + deltaTheta;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      // For circular orbit: rho0/rho = 1
      // Result: y = cos(delta_theta)*y0 + sin(delta_theta)*vy0
      //        vy = -sin(delta_theta)*y0 + cos(delta_theta)*vy0
      // With delta_theta = pi/2: cos=0, sin=1
      // y = 0*100 + 1*0 = 0
      // vy = -1*100 + 0*0 = -100
      expect(result.y).toBeCloseTo(0);
      expect(result.vy).toBeCloseTo(-100);
    });

    test("circular orbit: rotation by pi", () => {
      const initial: OutOfPlaneState = {
        y: 100,
        vy: 50,
      };
      const e = 0;
      const theta0: TrueAnomaly = 0;
      const theta: TrueAnomaly = Math.PI;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      // delta_theta = pi: cos(pi)=-1, sin(pi)=0
      // y = -1*100 + 0*50 = -100
      // vy = 0*100 + (-1)*50 = -50
      expect(result.y).toBeCloseTo(-100);
      expect(result.vy).toBeCloseTo(-50);
    });

    test("circular orbit: rotation by 2*pi returns to original", () => {
      const initial: OutOfPlaneState = {
        y: 200,
        vy: 100,
      };
      const e = 0;
      const theta0: TrueAnomaly = 0;
      const theta: TrueAnomaly = 2 * Math.PI;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      // delta_theta = 2*pi: cos(2*pi)=1, sin(2*pi)=0
      // Should return to original state
      expect(result.y).toBeCloseTo(initial.y);
      expect(result.vy).toBeCloseTo(initial.vy);
    });

    test("handles high eccentricity", () => {
      const initial: OutOfPlaneState = {
        y: 1000,
        vy: 100,
      };
      const e = 0.8;
      const theta0: TrueAnomaly = Math.PI / 6;
      const theta: TrueAnomaly = Math.PI / 3;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      expect(isFinite(result.y)).toBe(true);
      expect(isFinite(result.vy)).toBe(true);
    });

    test("backward propagation (negative delta theta)", () => {
      const initial: OutOfPlaneState = {
        y: 300,
        vy: 30,
      };
      const e = 0.3;
      const theta0: TrueAnomaly = Math.PI / 2;
      const theta: TrueAnomaly = Math.PI / 4; // earlier

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      expect(isFinite(result.y)).toBe(true);
      expect(isFinite(result.vy)).toBe(true);
    });

    test("propagation across various eccentricities", () => {
      const initial: OutOfPlaneState = {
        y: 500,
        vy: 50,
      };
      const theta0: TrueAnomaly = Math.PI / 6;
      const theta: TrueAnomaly = Math.PI / 3;
      const eccentricities = [0, 0.1, 0.3, 0.5, 0.7, 0.9];

      for (const e of eccentricities) {
        const result = propagateOutOfPlane(initial, e, theta0, theta);

        expect(isFinite(result.y)).toBe(true);
        expect(isFinite(result.vy)).toBe(true);
      }
    });

    test("propagation at various true anomalies", () => {
      const initial: OutOfPlaneState = {
        y: 400,
        vy: 40,
      };
      const e = 0.25;
      const testThetas: [number, number][] = [
        [0, Math.PI / 4],
        [Math.PI / 6, Math.PI / 2],
        [Math.PI / 4, (3 * Math.PI) / 4],
        [Math.PI / 2, Math.PI],
      ];

      for (const [theta0, theta] of testThetas) {
        const result = propagateOutOfPlane(initial, e, theta0, theta);

        expect(isFinite(result.y)).toBe(true);
        expect(isFinite(result.vy)).toBe(true);
      }
    });
  });

  describe("round-trip propagation", () => {
    test("forward then backward propagation recovers initial state", () => {
      const initial: OutOfPlaneState = {
        y: 600,
        vy: 60,
      };
      const e = 0.2;
      const theta0: TrueAnomaly = Math.PI / 6;
      const theta: TrueAnomaly = Math.PI / 3;

      // Forward propagation
      const forward = propagateOutOfPlane(initial, e, theta0, theta);

      // Backward propagation
      const backward = propagateOutOfPlane(forward, e, theta, theta0);

      expect(backward.y).toBeCloseTo(initial.y);
      expect(backward.vy).toBeCloseTo(initial.vy);
    });

    test("circular orbit round-trip", () => {
      const initial: OutOfPlaneState = {
        y: 800,
        vy: 80,
      };
      const e = 0;
      const theta0: TrueAnomaly = 0;
      const theta: TrueAnomaly = Math.PI / 2;

      const forward = propagateOutOfPlane(initial, e, theta0, theta);
      const backward = propagateOutOfPlane(forward, e, theta, theta0);

      expect(backward.y).toBeCloseTo(initial.y);
      expect(backward.vy).toBeCloseTo(initial.vy);
    });

    test("high eccentricity round-trip", () => {
      const initial: OutOfPlaneState = {
        y: 1200,
        vy: 120,
      };
      const e = 0.85;
      const theta0: TrueAnomaly = Math.PI / 4;
      const theta: TrueAnomaly = (3 * Math.PI) / 4;

      const forward = propagateOutOfPlane(initial, e, theta0, theta);
      const backward = propagateOutOfPlane(forward, e, theta, theta0);

      expect(backward.y).toBeCloseTo(initial.y);
      expect(backward.vy).toBeCloseTo(initial.vy);
    });
  });

  describe("conservation properties", () => {
    test("energy-like quantity is conserved in circular orbit", () => {
      // For circular orbit (e=0, rho=1), the transformation is a pure rotation
      // The quantity y^2 + vy^2 should be conserved
      const initial: OutOfPlaneState = {
        y: 100,
        vy: 100,
      };
      const e = 0;
      const theta0: TrueAnomaly = 0;
      const theta: TrueAnomaly = Math.PI / 4;

      const result = propagateOutOfPlane(initial, e, theta0, theta);

      const initialNorm = initial.y * initial.y + initial.vy * initial.vy;
      const finalNorm = result.y * result.y + result.vy * result.vy;

      expect(finalNorm).toBeCloseTo(initialNorm);
    });
  });
});

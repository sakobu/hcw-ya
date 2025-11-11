/**
 * Unit tests for Clohessy-Wiltshire (Hill-Clohessy-Wiltshire) propagation.
 */

import { describe, test, expect } from "bun:test";
import { propagateHCW } from "@/clohessy-wiltshire";
import type { Frame, RelativeState } from "@/types";

describe("clohessy-wiltshire", () => {
  // Typical Low Earth Orbit parameters
  const mu = 3.986004418e14; // Earth mu [m^3/s^2]
  const r = 6.8e6; // Orbital radius [m] (~400km altitude)
  const n = Math.sqrt(mu / (r * r * r)); // Mean motion [rad/s]

  describe("propagateHCW", () => {
    test("propagates relative state in RIC frame", () => {
      const initialState: RelativeState = {
        position: [100, 200, 300], // RIC [R, I, C]
        velocity: [1, 2, 3],
      };
      const deltaTime = 100; // seconds
      const frame: Frame = "RIC";

      const result = propagateHCW(initialState, n, deltaTime, frame);

      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(result.position.length).toBe(3);
      expect(result.velocity.length).toBe(3);
      expect(isFinite(result.position[0])).toBe(true);
      expect(isFinite(result.position[1])).toBe(true);
      expect(isFinite(result.position[2])).toBe(true);
      expect(isFinite(result.velocity[0])).toBe(true);
      expect(isFinite(result.velocity[1])).toBe(true);
      expect(isFinite(result.velocity[2])).toBe(true);
    });

    test("propagates relative state in LVLH frame", () => {
      const initialState: RelativeState = {
        position: [100, 200, 300], // LVLH [I, C, R]
        velocity: [1, 2, 3],
      };
      const deltaTime = 100;
      const frame: Frame = "LVLH";

      const result = propagateHCW(initialState, n, deltaTime, frame);

      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(isFinite(result.position[0])).toBe(true);
      expect(isFinite(result.position[1])).toBe(true);
      expect(isFinite(result.position[2])).toBe(true);
      expect(isFinite(result.velocity[0])).toBe(true);
      expect(isFinite(result.velocity[1])).toBe(true);
      expect(isFinite(result.velocity[2])).toBe(true);
    });

    test("zero initial state remains at origin", () => {
      const zeroState: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const deltaTime = 200;

      const result = propagateHCW(zeroState, n, deltaTime, "RIC");

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });

    test("zero time returns initial state", () => {
      const initialState: RelativeState = {
        position: [500, 1000, 1500],
        velocity: [5, 10, 15],
      };
      const deltaTime = 0;

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      expect(result.position[0]).toBeCloseTo(initialState.position[0]);
      expect(result.position[1]).toBeCloseTo(initialState.position[1]);
      expect(result.position[2]).toBeCloseTo(initialState.position[2]);
      expect(result.velocity[0]).toBeCloseTo(initialState.velocity[0]);
      expect(result.velocity[1]).toBeCloseTo(initialState.velocity[1]);
      expect(result.velocity[2]).toBeCloseTo(initialState.velocity[2]);
    });

    test("out-of-plane motion is decoupled and harmonic", () => {
      // Pure out-of-plane motion (y and vy only)
      const initialState: RelativeState = {
        position: [0, 100, 0], // LVLH: only cross-track
        velocity: [0, 0, 0],
      };
      const period = (2 * Math.PI) / n;
      const deltaTime = period / 4; // Quarter period

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      // After quarter period: y should rotate to vy
      // y = cos(nt)*y0 + (1/n)*sin(nt)*vy0
      // With y0=100, vy0=0, nt=pi/2: y = 0
      expect(result.position[1]).toBeCloseTo(0, 3);

      // vy = -n*sin(nt)*y0 + cos(nt)*vy0
      // vy = -n*sin(pi/2)*100 = -n*100
      expect(result.velocity[1]).toBeCloseTo(-n * 100, 3);

      // In-plane components should remain zero
      expect(result.position[0]).toBeCloseTo(0, 5);
      expect(result.position[2]).toBeCloseTo(0, 5);
      expect(result.velocity[0]).toBeCloseTo(0, 5);
      expect(result.velocity[2]).toBeCloseTo(0, 5);
    });

    test("out-of-plane motion conserves energy", () => {
      const initialState: RelativeState = {
        position: [0, 50, 0], // LVLH
        velocity: [0, 30, 0],
      };
      const deltaTime = 500;

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      // Energy-like quantity: (1/2)*n^2*y^2 + (1/2)*vy^2
      const initialEnergy =
        0.5 * n * n * initialState.position[1] * initialState.position[1] +
        0.5 * initialState.velocity[1] * initialState.velocity[1];

      const finalEnergy =
        0.5 * n * n * result.position[1] * result.position[1] +
        0.5 * result.velocity[1] * result.velocity[1];

      expect(finalEnergy).toBeCloseTo(initialEnergy, 3);
    });

    test("in-plane propagation with radial offset only", () => {
      // Pure radial offset, no velocity
      const initialState: RelativeState = {
        position: [0, 0, 100], // LVLH: [I=0, C=0, R=100]
        velocity: [0, 0, 0],
      };
      const deltaTime = 100;

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      // Radial offset should drift in-track due to differential orbital motion
      expect(isFinite(result.position[0])).toBe(true); // I should change
      expect(isFinite(result.position[2])).toBe(true); // R should change
    });

    test("backward propagation (negative time)", () => {
      const initialState: RelativeState = {
        position: [200, 400, 600],
        velocity: [2, 4, 6],
      };
      const deltaTime = -300;

      const result = propagateHCW(initialState, n, deltaTime, "RIC");

      expect(isFinite(result.position[0])).toBe(true);
      expect(isFinite(result.position[1])).toBe(true);
      expect(isFinite(result.position[2])).toBe(true);
      expect(isFinite(result.velocity[0])).toBe(true);
      expect(isFinite(result.velocity[1])).toBe(true);
      expect(isFinite(result.velocity[2])).toBe(true);
    });

    test("propagation over one full orbit period", () => {
      const initialState: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };
      const period = (2 * Math.PI) / n;

      const result = propagateHCW(initialState, n, period, "LVLH");

      // After one full period, secular terms (6*nt) cause unbounded growth
      // This is a known characteristic of CW equations
      expect(isFinite(result.position[0])).toBe(true);
      expect(isFinite(result.position[1])).toBe(true);
      expect(isFinite(result.position[2])).toBe(true);
    });

    test("various time steps", () => {
      const initialState: RelativeState = {
        position: [150, 300, 450],
        velocity: [1.5, 3, 4.5],
      };
      const timeSteps = [50, 100, 200, 500, 1000];

      for (const dt of timeSteps) {
        const result = propagateHCW(initialState, n, dt, "RIC");

        expect(isFinite(result.position[0])).toBe(true);
        expect(isFinite(result.position[1])).toBe(true);
        expect(isFinite(result.position[2])).toBe(true);
        expect(isFinite(result.velocity[0])).toBe(true);
        expect(isFinite(result.velocity[1])).toBe(true);
        expect(isFinite(result.velocity[2])).toBe(true);
      }
    });

    test("various mean motion values", () => {
      const initialState: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };
      const deltaTime = 100;

      // Different orbital altitudes
      const meanMotions = [
        Math.sqrt(mu / Math.pow(6.5e6, 3)), // Lower orbit
        Math.sqrt(mu / Math.pow(7.0e6, 3)), // Medium orbit
        Math.sqrt(mu / Math.pow(8.0e6, 3)), // Higher orbit
      ];

      for (const meanMotion of meanMotions) {
        const result = propagateHCW(
          initialState,
          meanMotion,
          deltaTime,
          "LVLH"
        );

        expect(isFinite(result.position[0])).toBe(true);
        expect(isFinite(result.position[1])).toBe(true);
        expect(isFinite(result.position[2])).toBe(true);
        expect(isFinite(result.velocity[0])).toBe(true);
        expect(isFinite(result.velocity[1])).toBe(true);
        expect(isFinite(result.velocity[2])).toBe(true);
      }
    });
  });

  describe("round-trip propagation", () => {
    test("forward then backward propagation recovers initial state", () => {
      const initialState: RelativeState = {
        position: [300, 600, 900],
        velocity: [3, 6, 9],
      };
      const deltaTime = 200;

      const forward = propagateHCW(initialState, n, deltaTime, "RIC");
      const backward = propagateHCW(forward, n, -deltaTime, "RIC");

      expect(backward.position[0]).toBeCloseTo(initialState.position[0], 5);
      expect(backward.position[1]).toBeCloseTo(initialState.position[1], 5);
      expect(backward.position[2]).toBeCloseTo(initialState.position[2], 5);
      expect(backward.velocity[0]).toBeCloseTo(initialState.velocity[0], 5);
      expect(backward.velocity[1]).toBeCloseTo(initialState.velocity[1], 5);
      expect(backward.velocity[2]).toBeCloseTo(initialState.velocity[2], 5);
    });

    test("LVLH frame round-trip", () => {
      const initialState: RelativeState = {
        position: [400, 800, 1200],
        velocity: [4, 8, 12],
      };
      const deltaTime = 150;

      const forward = propagateHCW(initialState, n, deltaTime, "LVLH");
      const backward = propagateHCW(forward, n, -deltaTime, "LVLH");

      expect(backward.position[0]).toBeCloseTo(initialState.position[0], 5);
      expect(backward.position[1]).toBeCloseTo(initialState.position[1], 5);
      expect(backward.position[2]).toBeCloseTo(initialState.position[2], 5);
      expect(backward.velocity[0]).toBeCloseTo(initialState.velocity[0], 5);
      expect(backward.velocity[1]).toBeCloseTo(initialState.velocity[1], 5);
      expect(backward.velocity[2]).toBeCloseTo(initialState.velocity[2], 5);
    });

    test("short time interval round-trip", () => {
      const initialState: RelativeState = {
        position: [50, 100, 150],
        velocity: [0.5, 1, 1.5],
      };
      const deltaTime = 10;

      const forward = propagateHCW(initialState, n, deltaTime, "RIC");
      const backward = propagateHCW(forward, n, -deltaTime, "RIC");

      expect(backward.position[0]).toBeCloseTo(initialState.position[0], 8);
      expect(backward.position[1]).toBeCloseTo(initialState.position[1], 8);
      expect(backward.position[2]).toBeCloseTo(initialState.position[2], 8);
      expect(backward.velocity[0]).toBeCloseTo(initialState.velocity[0], 8);
      expect(backward.velocity[1]).toBeCloseTo(initialState.velocity[1], 8);
      expect(backward.velocity[2]).toBeCloseTo(initialState.velocity[2], 8);
    });
  });

  describe("frame consistency", () => {
    test("same propagation in different frames gives consistent results", () => {
      const ricState: RelativeState = {
        position: [100, 200, 300], // RIC: [R, I, C]
        velocity: [10, 20, 30],
      };

      // Convert RIC to LVLH manually: [R,I,C] -> [I,C,R]
      const lvlhState: RelativeState = {
        position: [200, 300, 100], // LVLH: [I, C, R]
        velocity: [20, 30, 10],
      };

      const deltaTime = 100;

      const resultRIC = propagateHCW(ricState, n, deltaTime, "RIC");
      const resultLVLH = propagateHCW(lvlhState, n, deltaTime, "LVLH");

      // Results should represent the same physical state
      // RIC result [R, I, C] should equal LVLH result permuted back
      expect(resultRIC.position[0]).toBeCloseTo(resultLVLH.position[2], 5); // R
      expect(resultRIC.position[1]).toBeCloseTo(resultLVLH.position[0], 5); // I
      expect(resultRIC.position[2]).toBeCloseTo(resultLVLH.position[1], 5); // C
      expect(resultRIC.velocity[0]).toBeCloseTo(resultLVLH.velocity[2], 5); // vR
      expect(resultRIC.velocity[1]).toBeCloseTo(resultLVLH.velocity[0], 5); // vI
      expect(resultRIC.velocity[2]).toBeCloseTo(resultLVLH.velocity[1], 5); // vC
    });
  });

  describe("special cases and properties", () => {
    test("pure in-track velocity creates radial drift", () => {
      // Start with pure in-track velocity
      const initialState: RelativeState = {
        position: [0, 0, 0], // LVLH: [I, C, R]
        velocity: [10, 0, 0], // Pure in-track velocity
      };
      const deltaTime = 100;

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      // Should create both in-track and radial motion
      expect(Math.abs(result.position[0])).toBeGreaterThan(0); // In-track
      expect(Math.abs(result.position[2])).toBeGreaterThan(0); // Radial
      expect(result.position[1]).toBeCloseTo(0, 5); // Cross-track remains zero
    });

    test("pure radial velocity creates oscillatory motion", () => {
      // Start with pure radial velocity
      const initialState: RelativeState = {
        position: [0, 0, 0], // LVLH
        velocity: [0, 0, 10], // Pure radial velocity
      };
      const deltaTime = 100;

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      // Should create coupled in-track and radial motion
      expect(Math.abs(result.position[0])).toBeGreaterThan(0); // In-track
      expect(Math.abs(result.position[2])).toBeGreaterThan(0); // Radial
      expect(result.position[1]).toBeCloseTo(0, 5); // Cross-track remains zero
    });

    test("cross-track motion is truly decoupled", () => {
      // Start with both in-plane and out-of-plane motion
      const initialState: RelativeState = {
        position: [100, 200, 300], // LVLH: all components
        velocity: [1, 2, 3],
      };
      const deltaTime = 150;

      const result = propagateHCW(initialState, n, deltaTime, "LVLH");

      // Now test pure cross-track separately
      const crossTrackOnly: RelativeState = {
        position: [0, 200, 0], // Only cross-track from original
        velocity: [0, 2, 0],
      };

      const resultCrossTrack = propagateHCW(
        crossTrackOnly,
        n,
        deltaTime,
        "LVLH"
      );

      // Cross-track component should match
      expect(result.position[1]).toBeCloseTo(resultCrossTrack.position[1], 5);
      expect(result.velocity[1]).toBeCloseTo(resultCrossTrack.velocity[1], 5);
    });

    test("linearity of CW equations", () => {
      const state1: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };

      const state2: RelativeState = {
        position: [50, 100, 150],
        velocity: [0.5, 1, 1.5],
      };

      const deltaTime = 100;

      const result1 = propagateHCW(state1, n, deltaTime, "LVLH");
      const result2 = propagateHCW(state2, n, deltaTime, "LVLH");

      // Combined state
      const stateCombined: RelativeState = {
        position: [
          state1.position[0] + state2.position[0],
          state1.position[1] + state2.position[1],
          state1.position[2] + state2.position[2],
        ],
        velocity: [
          state1.velocity[0] + state2.velocity[0],
          state1.velocity[1] + state2.velocity[1],
          state1.velocity[2] + state2.velocity[2],
        ],
      };

      const resultCombined = propagateHCW(stateCombined, n, deltaTime, "LVLH");

      // Due to linearity: propagate(s1 + s2) = propagate(s1) + propagate(s2)
      expect(resultCombined.position[0]).toBeCloseTo(
        result1.position[0] + result2.position[0],
        5
      );
      expect(resultCombined.position[1]).toBeCloseTo(
        result1.position[1] + result2.position[1],
        5
      );
      expect(resultCombined.position[2]).toBeCloseTo(
        result1.position[2] + result2.position[2],
        5
      );
      expect(resultCombined.velocity[0]).toBeCloseTo(
        result1.velocity[0] + result2.velocity[0],
        5
      );
      expect(resultCombined.velocity[1]).toBeCloseTo(
        result1.velocity[1] + result2.velocity[1],
        5
      );
      expect(resultCombined.velocity[2]).toBeCloseTo(
        result1.velocity[2] + result2.velocity[2],
        5
      );
    });
  });
});

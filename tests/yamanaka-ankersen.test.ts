/**
 * Integration tests for the Yamanaka-Ankersen propagation algorithm.
 */

import { describe, test, expect } from "bun:test";
import { propagateYA } from "@/yamanaka-ankersen";
import type {
  Frame,
  OrbitalElements,
  RelativeState,
  TrueAnomaly,
} from "@/types";

describe("yamanaka-ankersen", () => {
  const earthElements: OrbitalElements = {
    eccentricity: 0.1,
    gravitationalParameter: 3.986004418e14, // Earth mu [m^3/s^2]
    angularMomentum: 5e10, // [m^2/s]
  };

  describe("propagateYA", () => {
    test("propagates relative state in RIC frame", () => {
      const initialState: RelativeState = {
        position: [1000, 500, 1500], // RIC [R, I, C]
        velocity: [10, 5, 15],
      };
      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = 100; // seconds
      const frame: Frame = "RIC";

      const result = propagateYA(
        initialState,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        frame
      );

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
        position: [1000, 500, 1500], // LVLH [I, C, R]
        velocity: [10, 5, 15],
      };
      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = 100;
      const frame: Frame = "LVLH";

      const result = propagateYA(
        initialState,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        frame
      );

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

    test("circular orbit propagation", () => {
      const circularElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 0,
      };
      const initialState: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };
      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 2;
      const deltaTime = 200;

      const result = propagateYA(
        initialState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

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
      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 3;
      const deltaTime = 150;

      const result = propagateYA(
        zeroState,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });

    test("propagation with zero time (same theta)", () => {
      const initialState: RelativeState = {
        position: [500, 1000, 1500],
        velocity: [5, 10, 15],
      };
      const theta: TrueAnomaly = Math.PI / 4;
      const deltaTime = 0;

      const result = propagateYA(
        initialState,
        earthElements,
        theta,
        theta,
        deltaTime,
        "LVLH"
      );

      // With zero time and same theta, state should be preserved
      // (though numerical precision may introduce small errors)
      expect(result.position[0]).toBeCloseTo(initialState.position[0], 5);
      expect(result.position[1]).toBeCloseTo(initialState.position[1], 5);
      expect(result.position[2]).toBeCloseTo(initialState.position[2], 5);
      expect(result.velocity[0]).toBeCloseTo(initialState.velocity[0], 5);
      expect(result.velocity[1]).toBeCloseTo(initialState.velocity[1], 5);
      expect(result.velocity[2]).toBeCloseTo(initialState.velocity[2], 5);
    });

    test("throws error for invalid eccentricity e < 0", () => {
      const invalidElements: OrbitalElements = {
        ...earthElements,
        eccentricity: -0.1,
      };
      const state: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };

      expect(() => {
        propagateYA(state, invalidElements, 0, Math.PI / 4, 100, "RIC");
      }).toThrow("Eccentricity must be in range [0, 1)");
    });

    test("throws error for invalid eccentricity e >= 1", () => {
      const invalidElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 1.0,
      };
      const state: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };

      expect(() => {
        propagateYA(state, invalidElements, 0, Math.PI / 4, 100, "RIC");
      }).toThrow("Eccentricity must be in range [0, 1)");
    });

    test("throws error for parabolic orbit e = 1", () => {
      const parabolicElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 1.0,
      };
      const state: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };

      expect(() => {
        propagateYA(state, parabolicElements, 0, Math.PI / 4, 100, "LVLH");
      }).toThrow();
    });

    test("throws error for hyperbolic orbit e > 1", () => {
      const hyperbolicElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 1.5,
      };
      const state: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };

      expect(() => {
        propagateYA(state, hyperbolicElements, 0, Math.PI / 4, 100, "RIC");
      }).toThrow();
    });

    test("handles high eccentricity near parabolic", () => {
      const highEccElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 0.95,
      };
      const state: RelativeState = {
        position: [1000, 2000, 3000],
        velocity: [10, 20, 30],
      };

      const result = propagateYA(
        state,
        highEccElements,
        Math.PI / 6,
        Math.PI / 3,
        200,
        "RIC"
      );

      expect(isFinite(result.position[0])).toBe(true);
      expect(isFinite(result.position[1])).toBe(true);
      expect(isFinite(result.position[2])).toBe(true);
      expect(isFinite(result.velocity[0])).toBe(true);
      expect(isFinite(result.velocity[1])).toBe(true);
      expect(isFinite(result.velocity[2])).toBe(true);
    });

    test("backward propagation (negative time)", () => {
      const state: RelativeState = {
        position: [800, 1600, 2400],
        velocity: [8, 16, 24],
      };
      const theta0: TrueAnomaly = Math.PI / 2;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = -100;

      const result = propagateYA(
        state,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      expect(isFinite(result.position[0])).toBe(true);
      expect(isFinite(result.position[1])).toBe(true);
      expect(isFinite(result.position[2])).toBe(true);
      expect(isFinite(result.velocity[0])).toBe(true);
      expect(isFinite(result.velocity[1])).toBe(true);
      expect(isFinite(result.velocity[2])).toBe(true);
    });
  });

  describe("round-trip propagation", () => {
    test("forward then backward propagation recovers initial state", () => {
      const initialState: RelativeState = {
        position: [1200, 2400, 3600],
        velocity: [12, 24, 36],
      };
      const theta0: TrueAnomaly = Math.PI / 6;
      const thetaF: TrueAnomaly = Math.PI / 3;
      const deltaTime = 150;

      // Forward propagation
      const forward = propagateYA(
        initialState,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

      // Backward propagation
      const backward = propagateYA(
        forward,
        earthElements,
        thetaF,
        theta0,
        -deltaTime,
        "RIC"
      );

      expect(backward.position[0]).toBeCloseTo(initialState.position[0], 3);
      expect(backward.position[1]).toBeCloseTo(initialState.position[1], 3);
      expect(backward.position[2]).toBeCloseTo(initialState.position[2], 3);
      expect(backward.velocity[0]).toBeCloseTo(initialState.velocity[0], 3);
      expect(backward.velocity[1]).toBeCloseTo(initialState.velocity[1], 3);
      expect(backward.velocity[2]).toBeCloseTo(initialState.velocity[2], 3);
    });

    test("circular orbit round-trip", () => {
      const circularElements: OrbitalElements = {
        ...earthElements,
        eccentricity: 0,
      };
      const initialState: RelativeState = {
        position: [600, 1200, 1800],
        velocity: [6, 12, 18],
      };
      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 2;
      const deltaTime = 200;

      const forward = propagateYA(
        initialState,
        circularElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      const backward = propagateYA(
        forward,
        circularElements,
        thetaF,
        theta0,
        -deltaTime,
        "LVLH"
      );

      expect(backward.position[0]).toBeCloseTo(initialState.position[0], 3);
      expect(backward.position[1]).toBeCloseTo(initialState.position[1], 3);
      expect(backward.position[2]).toBeCloseTo(initialState.position[2], 3);
      expect(backward.velocity[0]).toBeCloseTo(initialState.velocity[0], 3);
      expect(backward.velocity[1]).toBeCloseTo(initialState.velocity[1], 3);
      expect(backward.velocity[2]).toBeCloseTo(initialState.velocity[2], 3);
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

      const theta0: TrueAnomaly = Math.PI / 6;
      const thetaF: TrueAnomaly = Math.PI / 3;
      const deltaTime = 100;

      const resultRIC = propagateYA(
        ricState,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        "RIC"
      );

      const resultLVLH = propagateYA(
        lvlhState,
        earthElements,
        theta0,
        thetaF,
        deltaTime,
        "LVLH"
      );

      // Results should represent the same physical state
      // RIC result [R, I, C] should equal LVLH result permuted back
      expect(resultRIC.position[0]).toBeCloseTo(resultLVLH.position[2]); // R
      expect(resultRIC.position[1]).toBeCloseTo(resultLVLH.position[0]); // I
      expect(resultRIC.position[2]).toBeCloseTo(resultLVLH.position[1]); // C
      expect(resultRIC.velocity[0]).toBeCloseTo(resultLVLH.velocity[2]); // vR
      expect(resultRIC.velocity[1]).toBeCloseTo(resultLVLH.velocity[0]); // vI
      expect(resultRIC.velocity[2]).toBeCloseTo(resultLVLH.velocity[1]); // vC
    });
  });

  describe("various orbital configurations", () => {
    test("propagation across various eccentricities", () => {
      const state: RelativeState = {
        position: [500, 1000, 1500],
        velocity: [5, 10, 15],
      };
      const theta0: TrueAnomaly = 0;
      const thetaF: TrueAnomaly = Math.PI / 4;
      const deltaTime = 100;
      const eccentricities = [0, 0.1, 0.2, 0.4, 0.6, 0.8];

      for (const e of eccentricities) {
        const elements: OrbitalElements = {
          ...earthElements,
          eccentricity: e,
        };

        const result = propagateYA(
          state,
          elements,
          theta0,
          thetaF,
          deltaTime,
          "RIC"
        );

        expect(isFinite(result.position[0])).toBe(true);
        expect(isFinite(result.position[1])).toBe(true);
        expect(isFinite(result.position[2])).toBe(true);
        expect(isFinite(result.velocity[0])).toBe(true);
        expect(isFinite(result.velocity[1])).toBe(true);
        expect(isFinite(result.velocity[2])).toBe(true);
      }
    });

    test("propagation at various true anomalies", () => {
      const state: RelativeState = {
        position: [400, 800, 1200],
        velocity: [4, 8, 12],
      };
      const deltaTime = 120;
      const testPairs: [number, number][] = [
        [0, Math.PI / 6],
        [Math.PI / 6, Math.PI / 3],
        [Math.PI / 4, Math.PI / 2],
        [Math.PI / 2, (3 * Math.PI) / 4],
        [Math.PI / 3, (2 * Math.PI) / 3],
      ];

      for (const [theta0, thetaF] of testPairs) {
        const result = propagateYA(
          state,
          earthElements,
          theta0,
          thetaF,
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
});

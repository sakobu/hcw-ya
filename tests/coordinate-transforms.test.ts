/**
 * Unit tests for coordinate transformations between true and modified coordinates.
 */

import { describe, test, expect } from "bun:test";
import {
  toModifiedCoordinates,
  fromModifiedCoordinates,
} from "@/coordinate-transforms";
import type { OrbitalElements, RelativeState, TrueAnomaly } from "@/types";

describe("coordinate-transforms", () => {
  const testElements: OrbitalElements = {
    eccentricity: 0.2,
    gravitationalParameter: 3.986004418e14,
    angularMomentum: 5e10,
  };

  describe("toModifiedCoordinates", () => {
    test("transforms position and velocity to modified coordinates", () => {
      const state: RelativeState = {
        position: [100, 200, 300],
        velocity: [1, 2, 3],
      };
      const theta: TrueAnomaly = Math.PI / 4;

      const result = toModifiedCoordinates(state, testElements, theta);

      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(result.position.length).toBe(3);
      expect(result.velocity.length).toBe(3);
    });

    test("circular orbit (e=0) at theta=0 simplifies transformation", () => {
      const circularElements: OrbitalElements = {
        ...testElements,
        eccentricity: 0,
      };
      const state: RelativeState = {
        position: [100, 200, 300],
        velocity: [10, 20, 30],
      };
      const theta: TrueAnomaly = 0;

      const result = toModifiedCoordinates(state, circularElements, theta);

      // For circular orbit, rho=1, e*sin(theta)=0
      // Modified position: r_tilde = rho*r = 1*r = r
      expect(result.position[0]).toBeCloseTo(state.position[0]);
      expect(result.position[1]).toBeCloseTo(state.position[1]);
      expect(result.position[2]).toBeCloseTo(state.position[2]);
    });

    test("eccentric orbit at theta=0", () => {
      const state: RelativeState = {
        position: [1000, 0, 500],
        velocity: [5, 0, 2.5],
      };
      const theta: TrueAnomaly = 0;

      const result = toModifiedCoordinates(state, testElements, theta);

      // At theta=0, sin(theta)=0, cos(theta)=1
      // rho = 1 + e*cos(0) = 1 + e
      const e = testElements.eccentricity;
      const expectedRho = 1 + e;

      expect(result.position[0]).toBeCloseTo(expectedRho * state.position[0]);
      expect(result.position[1]).toBeCloseTo(expectedRho * state.position[1]);
      expect(result.position[2]).toBeCloseTo(expectedRho * state.position[2]);
    });

    test("zero state remains zero", () => {
      const zeroState: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const theta: TrueAnomaly = Math.PI / 3;

      const result = toModifiedCoordinates(zeroState, testElements, theta);

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });
  });

  describe("fromModifiedCoordinates", () => {
    test("transforms modified coordinates back to true coordinates", () => {
      const modifiedState: RelativeState = {
        position: [120, 240, 360],
        velocity: [0.01, 0.02, 0.03],
      };
      const theta: TrueAnomaly = Math.PI / 4;

      const result = fromModifiedCoordinates(
        modifiedState,
        testElements,
        theta
      );

      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(result.position.length).toBe(3);
      expect(result.velocity.length).toBe(3);
    });

    test("circular orbit (e=0) at theta=0 simplifies inverse transformation", () => {
      const circularElements: OrbitalElements = {
        ...testElements,
        eccentricity: 0,
      };
      const modifiedState: RelativeState = {
        position: [100, 200, 300],
        velocity: [0.01, 0.02, 0.03],
      };
      const theta: TrueAnomaly = 0;

      const result = fromModifiedCoordinates(
        modifiedState,
        circularElements,
        theta
      );

      // For circular orbit, rho=1, e*sin(theta)=0
      // True position: r = r_tilde/rho = r_tilde
      expect(result.position[0]).toBeCloseTo(modifiedState.position[0]);
      expect(result.position[1]).toBeCloseTo(modifiedState.position[1]);
      expect(result.position[2]).toBeCloseTo(modifiedState.position[2]);
    });

    test("zero state remains zero", () => {
      const zeroState: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const theta: TrueAnomaly = Math.PI / 6;

      const result = fromModifiedCoordinates(zeroState, testElements, theta);

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });
  });

  describe("round-trip transformations", () => {
    test("to-modified and from-modified are inverse operations", () => {
      const originalState: RelativeState = {
        position: [1000, 500, 1500],
        velocity: [5, 2.5, 7.5],
      };
      const theta: TrueAnomaly = Math.PI / 3;

      const modified = toModifiedCoordinates(
        originalState,
        testElements,
        theta
      );
      const recovered = fromModifiedCoordinates(modified, testElements, theta);

      expect(recovered.position[0]).toBeCloseTo(originalState.position[0]);
      expect(recovered.position[1]).toBeCloseTo(originalState.position[1]);
      expect(recovered.position[2]).toBeCloseTo(originalState.position[2]);
      expect(recovered.velocity[0]).toBeCloseTo(originalState.velocity[0]);
      expect(recovered.velocity[1]).toBeCloseTo(originalState.velocity[1]);
      expect(recovered.velocity[2]).toBeCloseTo(originalState.velocity[2]);
    });

    test("round-trip with circular orbit", () => {
      const circularElements: OrbitalElements = {
        ...testElements,
        eccentricity: 0,
      };
      const originalState: RelativeState = {
        position: [2000, 1000, 3000],
        velocity: [10, 5, 15],
      };
      const theta: TrueAnomaly = Math.PI / 2;

      const modified = toModifiedCoordinates(
        originalState,
        circularElements,
        theta
      );
      const recovered = fromModifiedCoordinates(
        modified,
        circularElements,
        theta
      );

      expect(recovered.position[0]).toBeCloseTo(originalState.position[0]);
      expect(recovered.position[1]).toBeCloseTo(originalState.position[1]);
      expect(recovered.position[2]).toBeCloseTo(originalState.position[2]);
      expect(recovered.velocity[0]).toBeCloseTo(originalState.velocity[0]);
      expect(recovered.velocity[1]).toBeCloseTo(originalState.velocity[1]);
      expect(recovered.velocity[2]).toBeCloseTo(originalState.velocity[2]);
    });

    test("round-trip with high eccentricity", () => {
      const eccentricElements: OrbitalElements = {
        ...testElements,
        eccentricity: 0.7,
      };
      const originalState: RelativeState = {
        position: [500, 1000, 1500],
        velocity: [2.5, 5, 7.5],
      };
      const theta: TrueAnomaly = Math.PI / 6;

      const modified = toModifiedCoordinates(
        originalState,
        eccentricElements,
        theta
      );
      const recovered = fromModifiedCoordinates(
        modified,
        eccentricElements,
        theta
      );

      expect(recovered.position[0]).toBeCloseTo(originalState.position[0]);
      expect(recovered.position[1]).toBeCloseTo(originalState.position[1]);
      expect(recovered.position[2]).toBeCloseTo(originalState.position[2]);
      expect(recovered.velocity[0]).toBeCloseTo(originalState.velocity[0]);
      expect(recovered.velocity[1]).toBeCloseTo(originalState.velocity[1]);
      expect(recovered.velocity[2]).toBeCloseTo(originalState.velocity[2]);
    });

    test("round-trip at various true anomalies", () => {
      const testThetas = [
        0,
        Math.PI / 6,
        Math.PI / 4,
        Math.PI / 2,
        Math.PI,
        (3 * Math.PI) / 2,
      ];
      const state: RelativeState = {
        position: [800, 600, 400],
        velocity: [4, 3, 2],
      };

      for (const theta of testThetas) {
        const modified = toModifiedCoordinates(state, testElements, theta);
        const recovered = fromModifiedCoordinates(
          modified,
          testElements,
          theta
        );

        expect(recovered.position[0]).toBeCloseTo(state.position[0]);
        expect(recovered.position[1]).toBeCloseTo(state.position[1]);
        expect(recovered.position[2]).toBeCloseTo(state.position[2]);
        expect(recovered.velocity[0]).toBeCloseTo(state.velocity[0]);
        expect(recovered.velocity[1]).toBeCloseTo(state.velocity[1]);
        expect(recovered.velocity[2]).toBeCloseTo(state.velocity[2]);
      }
    });
  });
});

/**
 * Unit tests for coordinate frame conversions between RIC and LVLH frames.
 */

import { describe, test, expect } from "bun:test";
import { toInternalFromFrame, fromInternalToFrame } from "@/frames";
import type { Frame, RelativeState } from "@/types";

describe("frames", () => {
  describe("toInternalFromFrame", () => {
    test("LVLH to internal is identity (LVLH == internal [I,C,R])", () => {
      const state: RelativeState = {
        position: [100, 200, 300], // [I, C, R]
        velocity: [1, 2, 3],
      };
      const frame: Frame = "LVLH";

      const result = toInternalFromFrame(state, frame);

      expect(result.position[0]).toBe(state.position[0]);
      expect(result.position[1]).toBe(state.position[1]);
      expect(result.position[2]).toBe(state.position[2]);
      expect(result.velocity[0]).toBe(state.velocity[0]);
      expect(result.velocity[1]).toBe(state.velocity[1]);
      expect(result.velocity[2]).toBe(state.velocity[2]);
    });

    test("RIC to internal permutes [R,I,C] -> [I,C,R]", () => {
      const state: RelativeState = {
        position: [100, 200, 300], // [R, I, C]
        velocity: [1, 2, 3], // [vR, vI, vC]
      };
      const frame: Frame = "RIC";

      const result = toInternalFromFrame(state, frame);

      // Internal ordering [x,y,z] = [I,C,R]
      // From RIC [R,I,C]: I=state[1], C=state[2], R=state[0]
      expect(result.position[0]).toBe(200); // I
      expect(result.position[1]).toBe(300); // C
      expect(result.position[2]).toBe(100); // R
      expect(result.velocity[0]).toBe(2); // vI
      expect(result.velocity[1]).toBe(3); // vC
      expect(result.velocity[2]).toBe(1); // vR
    });

    test("zero state in RIC frame", () => {
      const state: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const frame: Frame = "RIC";

      const result = toInternalFromFrame(state, frame);

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });

    test("zero state in LVLH frame", () => {
      const state: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const frame: Frame = "LVLH";

      const result = toInternalFromFrame(state, frame);

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });
  });

  describe("fromInternalToFrame", () => {
    test("internal to LVLH is identity", () => {
      const state: RelativeState = {
        position: [100, 200, 300], // [I, C, R]
        velocity: [1, 2, 3],
      };
      const frame: Frame = "LVLH";

      const result = fromInternalToFrame(state, frame);

      expect(result.position[0]).toBe(state.position[0]);
      expect(result.position[1]).toBe(state.position[1]);
      expect(result.position[2]).toBe(state.position[2]);
      expect(result.velocity[0]).toBe(state.velocity[0]);
      expect(result.velocity[1]).toBe(state.velocity[1]);
      expect(result.velocity[2]).toBe(state.velocity[2]);
    });

    test("internal to RIC permutes [I,C,R] -> [R,I,C]", () => {
      const state: RelativeState = {
        position: [100, 200, 300], // Internal [I, C, R]
        velocity: [1, 2, 3], // [vI, vC, vR]
      };
      const frame: Frame = "RIC";

      const result = fromInternalToFrame(state, frame);

      // RIC ordering [R,I,C]
      // From internal [I,C,R]: R=state[2], I=state[0], C=state[1]
      expect(result.position[0]).toBe(300); // R
      expect(result.position[1]).toBe(100); // I
      expect(result.position[2]).toBe(200); // C
      expect(result.velocity[0]).toBe(3); // vR
      expect(result.velocity[1]).toBe(1); // vI
      expect(result.velocity[2]).toBe(2); // vC
    });

    test("zero state to RIC frame", () => {
      const state: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const frame: Frame = "RIC";

      const result = fromInternalToFrame(state, frame);

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });

    test("zero state to LVLH frame", () => {
      const state: RelativeState = {
        position: [0, 0, 0],
        velocity: [0, 0, 0],
      };
      const frame: Frame = "LVLH";

      const result = fromInternalToFrame(state, frame);

      expect(result.position[0]).toBe(0);
      expect(result.position[1]).toBe(0);
      expect(result.position[2]).toBe(0);
      expect(result.velocity[0]).toBe(0);
      expect(result.velocity[1]).toBe(0);
      expect(result.velocity[2]).toBe(0);
    });
  });

  describe("round-trip conversions", () => {
    test("RIC round-trip: RIC -> internal -> RIC", () => {
      const originalState: RelativeState = {
        position: [500, 1000, 1500], // RIC [R, I, C]
        velocity: [5, 10, 15],
      };
      const frame: Frame = "RIC";

      const internal = toInternalFromFrame(originalState, frame);
      const recovered = fromInternalToFrame(internal, frame);

      expect(recovered.position[0]).toBe(originalState.position[0]);
      expect(recovered.position[1]).toBe(originalState.position[1]);
      expect(recovered.position[2]).toBe(originalState.position[2]);
      expect(recovered.velocity[0]).toBe(originalState.velocity[0]);
      expect(recovered.velocity[1]).toBe(originalState.velocity[1]);
      expect(recovered.velocity[2]).toBe(originalState.velocity[2]);
    });

    test("LVLH round-trip: LVLH -> internal -> LVLH", () => {
      const originalState: RelativeState = {
        position: [1000, 2000, 3000], // LVLH [I, C, R]
        velocity: [10, 20, 30],
      };
      const frame: Frame = "LVLH";

      const internal = toInternalFromFrame(originalState, frame);
      const recovered = fromInternalToFrame(internal, frame);

      expect(recovered.position[0]).toBe(originalState.position[0]);
      expect(recovered.position[1]).toBe(originalState.position[1]);
      expect(recovered.position[2]).toBe(originalState.position[2]);
      expect(recovered.velocity[0]).toBe(originalState.velocity[0]);
      expect(recovered.velocity[1]).toBe(originalState.velocity[1]);
      expect(recovered.velocity[2]).toBe(originalState.velocity[2]);
    });

    test("Internal round-trip: internal -> RIC -> internal", () => {
      const originalInternal: RelativeState = {
        position: [100, 200, 300], // Internal [I, C, R]
        velocity: [1, 2, 3],
      };

      const ric = fromInternalToFrame(originalInternal, "RIC");
      const recovered = toInternalFromFrame(ric, "RIC");

      expect(recovered.position[0]).toBe(originalInternal.position[0]);
      expect(recovered.position[1]).toBe(originalInternal.position[1]);
      expect(recovered.position[2]).toBe(originalInternal.position[2]);
      expect(recovered.velocity[0]).toBe(originalInternal.velocity[0]);
      expect(recovered.velocity[1]).toBe(originalInternal.velocity[1]);
      expect(recovered.velocity[2]).toBe(originalInternal.velocity[2]);
    });

    test("Internal round-trip: internal -> LVLH -> internal", () => {
      const originalInternal: RelativeState = {
        position: [400, 500, 600], // Internal [I, C, R]
        velocity: [4, 5, 6],
      };

      const lvlh = fromInternalToFrame(originalInternal, "LVLH");
      const recovered = toInternalFromFrame(lvlh, "LVLH");

      expect(recovered.position[0]).toBe(originalInternal.position[0]);
      expect(recovered.position[1]).toBe(originalInternal.position[1]);
      expect(recovered.position[2]).toBe(originalInternal.position[2]);
      expect(recovered.velocity[0]).toBe(originalInternal.velocity[0]);
      expect(recovered.velocity[1]).toBe(originalInternal.velocity[1]);
      expect(recovered.velocity[2]).toBe(originalInternal.velocity[2]);
    });
  });

  describe("frame conversion consistency", () => {
    test("RIC and LVLH represent same physical state", () => {
      // Define a state in RIC
      const ricState: RelativeState = {
        position: [100, 200, 300], // RIC: [R=100, I=200, C=300]
        velocity: [10, 20, 30],
      };

      // Convert RIC -> internal (which is LVLH)
      const internal = toInternalFromFrame(ricState, "RIC");

      // The internal representation should be [I, C, R] = [200, 300, 100]
      expect(internal.position[0]).toBe(200); // I
      expect(internal.position[1]).toBe(300); // C
      expect(internal.position[2]).toBe(100); // R

      // Express the same internal state as LVLH
      const lvlhState = fromInternalToFrame(internal, "LVLH");

      // LVLH should match internal: [I, C, R] = [200, 300, 100]
      expect(lvlhState.position[0]).toBe(200);
      expect(lvlhState.position[1]).toBe(300);
      expect(lvlhState.position[2]).toBe(100);
    });

    test("conversions preserve physical quantities", () => {
      const ricState: RelativeState = {
        position: [150, 250, 350],
        velocity: [15, 25, 35],
      };

      // Convert through both representations
      const internal = toInternalFromFrame(ricState, "RIC");
      const lvlhState = fromInternalToFrame(internal, "LVLH");
      const backToRic = toInternalFromFrame(lvlhState, "LVLH");
      const finalRic = fromInternalToFrame(backToRic, "RIC");

      expect(finalRic.position[0]).toBe(ricState.position[0]);
      expect(finalRic.position[1]).toBe(ricState.position[1]);
      expect(finalRic.position[2]).toBe(ricState.position[2]);
      expect(finalRic.velocity[0]).toBe(ricState.velocity[0]);
      expect(finalRic.velocity[1]).toBe(ricState.velocity[1]);
      expect(finalRic.velocity[2]).toBe(ricState.velocity[2]);
    });
  });
});

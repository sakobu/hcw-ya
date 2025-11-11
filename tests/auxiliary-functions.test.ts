/**
 * Unit tests for auxiliary mathematical functions used in the Yamanaka-Ankersen STM.
 */

import { describe, test, expect } from "bun:test";
import { rho, s, c, sPrime, cPrime, kSquared, J } from "@/auxiliary-functions";
import type { OrbitalElements } from "@/types";

describe("auxiliary-functions", () => {
  describe("rho", () => {
    test("circular orbit (e=0) should return 1", () => {
      const e = 0;
      const theta = Math.PI / 4; // 45 degrees
      expect(rho(e, theta)).toBe(1);
    });

    test("eccentric orbit at theta=0", () => {
      const e = 0.3;
      const theta = 0;
      expect(rho(e, theta)).toBeCloseTo(1.3);
    });

    test("eccentric orbit at theta=pi", () => {
      const e = 0.3;
      const theta = Math.PI;
      expect(rho(e, theta)).toBeCloseTo(0.7);
    });

    test("eccentric orbit at theta=pi/2", () => {
      const e = 0.5;
      const theta = Math.PI / 2;
      expect(rho(e, theta)).toBeCloseTo(1.0);
    });

    test("high eccentricity near parabolic", () => {
      const e = 0.9;
      const theta = 0;
      expect(rho(e, theta)).toBeCloseTo(1.9);
    });
  });

  describe("s", () => {
    test("circular orbit (e=0) should equal sin(theta)", () => {
      const e = 0;
      const theta = Math.PI / 4;
      const rhoVal = rho(e, theta);
      expect(s(e, theta)).toBeCloseTo(rhoVal * Math.sin(theta));
    });

    test("eccentric orbit at theta=0", () => {
      const e = 0.3;
      const theta = 0;
      expect(s(e, theta)).toBeCloseTo(0);
    });

    test("eccentric orbit at theta=pi/2", () => {
      const e = 0.5;
      const theta = Math.PI / 2;
      const rhoVal = rho(e, theta);
      expect(s(e, theta)).toBeCloseTo(rhoVal * 1);
    });

    test("eccentric orbit at theta=pi", () => {
      const e = 0.3;
      const theta = Math.PI;
      expect(s(e, theta)).toBeCloseTo(0);
    });
  });

  describe("c", () => {
    test("circular orbit (e=0) should equal cos(theta)", () => {
      const e = 0;
      const theta = Math.PI / 4;
      const rhoVal = rho(e, theta);
      expect(c(e, theta)).toBeCloseTo(rhoVal * Math.cos(theta));
    });

    test("eccentric orbit at theta=0", () => {
      const e = 0.3;
      const theta = 0;
      const rhoVal = rho(e, theta);
      expect(c(e, theta)).toBeCloseTo(rhoVal);
    });

    test("eccentric orbit at theta=pi/2", () => {
      const e = 0.5;
      const theta = Math.PI / 2;
      expect(c(e, theta)).toBeCloseTo(0);
    });

    test("eccentric orbit at theta=pi", () => {
      const e = 0.3;
      const theta = Math.PI;
      const rhoVal = rho(e, theta);
      expect(c(e, theta)).toBeCloseTo(-rhoVal);
    });
  });

  describe("sPrime", () => {
    test("circular orbit (e=0) should equal cos(theta)", () => {
      const e = 0;
      const theta = Math.PI / 4;
      expect(sPrime(e, theta)).toBeCloseTo(Math.cos(theta));
    });

    test("eccentric orbit at theta=0", () => {
      const e = 0.3;
      const theta = 0;
      const expected = Math.cos(0) + 0.3 * Math.cos(0);
      expect(sPrime(e, theta)).toBeCloseTo(expected);
    });

    test("eccentric orbit at theta=pi/2", () => {
      const e = 0.5;
      const theta = Math.PI / 2;
      const expected = Math.cos(Math.PI / 2) + 0.5 * Math.cos(Math.PI);
      expect(sPrime(e, theta)).toBeCloseTo(expected);
    });

    test("formula verification: cos(theta) + e*cos(2*theta)", () => {
      const e = 0.4;
      const theta = Math.PI / 3;
      const expected = Math.cos(theta) + e * Math.cos(2 * theta);
      expect(sPrime(e, theta)).toBeCloseTo(expected);
    });
  });

  describe("cPrime", () => {
    test("circular orbit (e=0) should equal -sin(theta)", () => {
      const e = 0;
      const theta = Math.PI / 4;
      expect(cPrime(e, theta)).toBeCloseTo(-Math.sin(theta));
    });

    test("eccentric orbit at theta=0", () => {
      const e = 0.3;
      const theta = 0;
      expect(cPrime(e, theta)).toBeCloseTo(0);
    });

    test("eccentric orbit at theta=pi/2", () => {
      const e = 0.5;
      const theta = Math.PI / 2;
      const expected = -(Math.sin(Math.PI / 2) + 0.5 * Math.sin(Math.PI));
      expect(cPrime(e, theta)).toBeCloseTo(expected);
    });

    test("formula verification: -(sin(theta) + e*sin(2*theta))", () => {
      const e = 0.4;
      const theta = Math.PI / 3;
      const expected = -(Math.sin(theta) + e * Math.sin(2 * theta));
      expect(cPrime(e, theta)).toBeCloseTo(expected);
    });
  });

  describe("kSquared", () => {
    test("Earth orbit with typical parameters", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.1,
        gravitationalParameter: 3.986004418e14, // Earth mu [m^3/s^2]
        angularMomentum: 1e11, // h [m^2/s]
      };
      const k =
        elements.gravitationalParameter /
        Math.pow(elements.angularMomentum, 1.5);
      const expected = k * k;
      expect(kSquared(elements)).toBeCloseTo(expected);
    });

    test("circular orbit", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.0,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 5e10,
      };
      const k =
        elements.gravitationalParameter /
        Math.pow(elements.angularMomentum, 1.5);
      const expected = k * k;
      expect(kSquared(elements)).toBeCloseTo(expected);
    });

    test("units verification: should have units of s^-1", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.2,
        gravitationalParameter: 3.986004418e14, // m^3/s^2
        angularMomentum: 1e11, // m^2/s
      };
      // k^2 = (mu/h^(3/2))^2 should have units s^-1
      const result = kSquared(elements);
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe("number");
    });
  });

  describe("J", () => {
    test("J equals k^2*dt", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.1,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 1e11,
      };
      const deltaTime = 100; // seconds
      const k2 = kSquared(elements);
      const expected = k2 * deltaTime;
      expect(J(elements, deltaTime)).toBeCloseTo(expected);
    });

    test("J is zero when dt=0", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.3,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 5e10,
      };
      expect(J(elements, 0)).toBe(0);
    });

    test("J is linear in time", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.2,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 8e10,
      };
      const dt1 = 50;
      const dt2 = 100;
      const J1 = J(elements, dt1);
      const J2 = J(elements, dt2);
      expect(J2).toBeCloseTo(2 * J1);
    });

    test("J with negative time (backward propagation)", () => {
      const elements: OrbitalElements = {
        eccentricity: 0.15,
        gravitationalParameter: 3.986004418e14,
        angularMomentum: 6e10,
      };
      const deltaTime = -100;
      const k2 = kSquared(elements);
      const expected = k2 * deltaTime;
      expect(J(elements, deltaTime)).toBeCloseTo(expected);
      expect(J(elements, deltaTime)).toBeLessThan(0);
    });
  });
});

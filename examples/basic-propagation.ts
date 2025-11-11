/**
 * Basic Propagation Example
 *
 * This example demonstrates the simplest use case of the RPO Suite:
 * propagating a relative state between two spacecraft using the
 * Yamanaka-Ankersen algorithm for an elliptical orbit.
 *
 * Run with: bun run examples/basic-propagation.ts
 */

import {
  propagateYA,
  trueAnomalyAtTime,
  type OrbitalElements,
  type RelativeState,
} from "../src/index";

// Define the reference orbit parameters
// This represents a typical Low Earth Orbit (LEO) with slight eccentricity
const orbitalElements: OrbitalElements = {
  eccentricity: 0.1, // Slightly elliptical orbit
  gravitationalParameter: 3.986004418e14, // Earth's mu [m^3/s^2]
  angularMomentum: 5.409e10, // h [m^2/s] - periapsis ~300km, apoapsis ~1782km
};

// Define the initial relative state between two spacecraft
// Position and velocity are given in the RIC frame:
// R = Radial (away from Earth's center)
// I = In-track (along velocity direction)
// C = Cross-track (normal to orbital plane)
const initialState: RelativeState = {
  position: [100, 200, 50] as const, // [R, I, C] in meters
  velocity: [0.5, -0.2, 0.1] as const, // [vR, vI, vC] in m/s
};

// Define the propagation interval
const theta0 = 0; // Initial true anomaly [rad] - at periapsis
const deltaTime = 1000; // Time elapsed [seconds] (~16.7 minutes)

// Calculate the final true anomaly using Kepler's equation
const thetaF = trueAnomalyAtTime(orbitalElements, theta0, deltaTime);

console.log("\n" + "=".repeat(70));
console.log("  Yamanaka-Ankersen Relative Motion Propagation Example");
console.log("=".repeat(70) + "\n");

console.log("ORBITAL PARAMETERS:");
console.table({
  "Eccentricity (e)": orbitalElements.eccentricity,
  "Gravitational parameter (mu)": `${orbitalElements.gravitationalParameter.toExponential(
    3
  )} m^3/s^2`,
  "Angular momentum (h)": `${orbitalElements.angularMomentum.toExponential(
    2
  )} m^2/s`,
});

console.log("\nINITIAL STATE (at periapsis):");
console.table({
  "R (radial)": `${initialState.position[0].toFixed(2)} m`,
  "I (in-track)": `${initialState.position[1].toFixed(2)} m`,
  "C (cross-track)": `${initialState.position[2].toFixed(2)} m`,
  "vR (radial)": `${initialState.velocity[0].toFixed(3)} m/s`,
  "vI (in-track)": `${initialState.velocity[1].toFixed(3)} m/s`,
  "vC (cross-track)": `${initialState.velocity[2].toFixed(3)} m/s`,
});

console.log("\nPROPAGATION INTERVAL:");
console.table({
  "Initial true anomaly": `${theta0.toFixed(4)} rad (${(
    (theta0 * 180) /
    Math.PI
  ).toFixed(1)} deg)`,
  "Time elapsed": `${deltaTime} s (${(deltaTime / 60).toFixed(1)} min)`,
  "Final true anomaly": `${thetaF.toFixed(4)} rad (${(
    (thetaF * 180) /
    Math.PI
  ).toFixed(1)} deg)`,
});

// Perform the propagation
const finalState = propagateYA(
  initialState,
  orbitalElements,
  theta0,
  thetaF,
  deltaTime,
  "RIC" // Use RIC frame for input and output
);

console.log(
  `\nFINAL STATE (at theta = ${((thetaF * 180) / Math.PI).toFixed(1)} deg):`
);
console.table({
  "R (radial)": `${finalState.position[0].toFixed(2)} m`,
  "I (in-track)": `${finalState.position[1].toFixed(2)} m`,
  "C (cross-track)": `${finalState.position[2].toFixed(2)} m`,
  "vR (radial)": `${finalState.velocity[0].toFixed(3)} m/s`,
  "vI (in-track)": `${finalState.velocity[1].toFixed(3)} m/s`,
  "vC (cross-track)": `${finalState.velocity[2].toFixed(3)} m/s`,
});

// Calculate changes for insight
const [r0, i0, c0] = initialState.position;
const [vr0, vi0, vc0] = initialState.velocity;
const [r1, i1, c1] = finalState.position;
const [vr1, vi1, vc1] = finalState.velocity;

const deltaR = r1 - r0;
const deltaI = i1 - i0;
const deltaC = c1 - c0;
const deltaVR = vr1 - vr0;
const deltaVI = vi1 - vi0;
const deltaVC = vc1 - vc0;

const initialDistance = Math.sqrt(r0 ** 2 + i0 ** 2 + c0 ** 2);
const finalDistance = Math.sqrt(r1 ** 2 + i1 ** 2 + c1 ** 2);

console.log("\nCHANGES:");
console.table({
  "Delta R (radial)": `${deltaR.toFixed(2)} m`,
  "Delta I (in-track)": `${deltaI.toFixed(2)} m`,
  "Delta C (cross-track)": `${deltaC.toFixed(2)} m`,
  "Delta vR": `${deltaVR.toFixed(3)} m/s`,
  "Delta vI": `${deltaVI.toFixed(3)} m/s`,
  "Delta vC": `${deltaVC.toFixed(3)} m/s`,
});

console.log("\nSEPARATION DISTANCE:");
console.table({
  "Initial distance": `${initialDistance.toFixed(2)} m`,
  "Final distance": `${finalDistance.toFixed(2)} m`,
  Change: `${(finalDistance - initialDistance).toFixed(2)} m`,
});

console.log("=".repeat(70));
console.log("Propagation complete!");
console.log("=".repeat(70) + "\n");

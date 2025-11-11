# RPO Suite

TypeScript library for spacecraft relative motion propagation implementing the Yamanaka-Ankersen and Clohessy-Wiltshire algorithms for Rendezvous and Proximity Operations.

## Overview

This library provides analytical solutions for propagating the relative state between two spacecraft in orbit. It implements the Yamanaka-Ankersen State Transition Matrix for elliptical orbits and the classical Clohessy-Wiltshire equations for circular orbits.

Based on: "New State Transition Matrix for Relative Motion on an Arbitrary Elliptical Orbit" by Yamanaka & Ankersen, Journal of Guidance, Control, and Dynamics, Vol. 25, No. 1, 2002.

## Installation

```bash
# npm
npm install rpo-suite

# pnpm
pnpm add rpo-suite

# yarn
yarn add rpo-suite

# bun
bun add rpo-suite
```

## Quick Start

```typescript
import { propagateYA, trueAnomalyAtTime, type OrbitalElements, type RelativeState } from "rpo-suite";

// Define orbital parameters
const elements: OrbitalElements = {
  eccentricity: 0.1,
  gravitationalParameter: 3.986004418e14, // Earth's mu in m^3/s^2
  angularMomentum: 5.409e10, // h in m^2/s
};

// Define initial relative state in RIC frame
const initialState: RelativeState = {
  position: [100, 200, 50] as const, // [R, I, C] in meters
  velocity: [0.5, -0.2, 0.1] as const, // [vR, vI, vC] in m/s
};

// Propagate forward in time
const theta0 = 0; // Initial true anomaly in radians
const deltaTime = 1000; // Time elapsed in seconds
const thetaF = trueAnomalyAtTime(elements, theta0, deltaTime);

const finalState = propagateYA(
  initialState,
  elements,
  theta0,
  thetaF,
  deltaTime,
  "RIC"
);
```

## Features

- Yamanaka-Ankersen propagation for elliptical orbits (eccentricity 0 to 1)
- Clohessy-Wiltshire propagation for circular orbits
- Support for RIC and LVLH reference frames
- Kepler equation solver for time-based propagation
- Fully typed with TypeScript strict mode
- Zero dependencies (except dev dependencies)

## API

### Main Functions

**propagateYA(initialState, elements, theta0, thetaF, deltaTime, frame)**

Propagate relative state using Yamanaka-Ankersen algorithm for elliptical orbits.

Parameters:
- `initialState`: Initial relative position and velocity
- `elements`: Orbital elements (eccentricity, gravitational parameter, angular momentum)
- `theta0`: Initial true anomaly in radians
- `thetaF`: Final true anomaly in radians
- `deltaTime`: Time elapsed in seconds
- `frame`: Reference frame ("RIC" or "LVLH")

Returns: Final relative state in the specified frame

**propagateHCW(initialState, orbitalRate, deltaTime, frame)**

Propagate relative state using Clohessy-Wiltshire equations for circular orbits.

Parameters:
- `initialState`: Initial relative position and velocity
- `orbitalRate`: Mean motion (n) in rad/s
- `deltaTime`: Time elapsed in seconds
- `frame`: Reference frame ("RIC" or "LVLH")

Returns: Final relative state in the specified frame

### Utility Functions

**trueAnomalyAtTime(elements, theta0, deltaTime)**

Compute true anomaly at a future time using Kepler propagation.

**trueAnomalyFromMean(meanAnomaly, eccentricity, tolerance?)**

Convert mean anomaly to true anomaly by solving Kepler's equation.

**orbitalPeriod(elements)**

Calculate orbital period from orbital elements.

## Reference Frames

The library supports two local-orbital reference frames:

**RIC (Radial, In-track, Cross-track)**
- R: Radial direction (away from Earth center)
- I: In-track direction (along velocity vector)
- C: Cross-track direction (normal to orbital plane)

**LVLH (Local Vertical Local Horizontal)**
- Same axes as RIC but ordered as [I, C, R]

## Units

- Distance: meters
- Velocity: meters per second
- Time: seconds
- Angles: radians
- Gravitational parameter: m^3/s^2
- Angular momentum: m^2/s

## Development

```bash
# Build the library
bun run build

# Build in watch mode
bun run build:watch

# Run example
bun run demo

# Run tests
bun test

# Run tests in watch mode
bun test:watch
```

## License

MIT

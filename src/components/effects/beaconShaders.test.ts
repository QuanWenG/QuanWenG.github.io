import { describe, expect, it } from 'vitest'
import techBeaconSource from './TechBeacon.tsx?raw'
import { beaconFragmentShader } from './beaconShaders'

describe('technology beacon decoration', () => {
  it('uses open orbital arcs without a circular core plate or radial bubble', () => {
    expect(techBeaconSource).not.toContain('circleGeometry')
    expect(beaconFragmentShader).toContain('arcA')
    expect(beaconFragmentShader).toContain('arcB')
    expect(beaconFragmentShader).toContain('orbitSpark')
    expect(beaconFragmentShader).not.toContain('innerRing')
    expect(beaconFragmentShader).not.toContain('outerRing')
    expect(beaconFragmentShader).not.toContain('halo')
  })
})

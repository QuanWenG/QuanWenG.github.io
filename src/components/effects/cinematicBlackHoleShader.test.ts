import { describe, expect, it } from 'vitest'
import {
  createWorldSpaceKerrBlackHoleUniforms,
  WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS,
  WORLD_SPACE_BLACK_HOLE_DISK_INNER_SCALE_HEIGHT,
  WORLD_SPACE_BLACK_HOLE_DISK_NORMAL,
  WORLD_SPACE_BLACK_HOLE_DISK_INNER_TO_OUTER_RATIO,
  WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS,
  WORLD_SPACE_BLACK_HOLE_DISK_OUTER_SCALE_HEIGHT,
  WORLD_SPACE_BLACK_HOLE_HORIZON_RADIUS,
  WORLD_SPACE_BLACK_HOLE_HORIZON_TO_DISK_RATIO,
  WORLD_SPACE_BLACK_HOLE_INTEGRATION_RADIUS,
  WORLD_SPACE_BLACK_HOLE_LENSING_MARGIN,
  WORLD_SPACE_BLACK_HOLE_OUTER_WORLD_RADIUS,
  worldSpaceKerrBlackHoleFragmentShader,
} from './worldSpaceKerrBlackHoleShader'

describe('world-space Kerr black hole', () => {
  it('reconstructs world rays from the live camera and keeps a fixed disk axis', () => {
    const uniforms = createWorldSpaceKerrBlackHoleUniforms()
    expect(uniforms.uSpaceDepth.value).toBeNull()
    expect(uniforms.uSpin.value).toBeGreaterThan(0.9)
    expect(WORLD_SPACE_BLACK_HOLE_HORIZON_TO_DISK_RATIO).toBe(0.235)
    expect(WORLD_SPACE_BLACK_HOLE_DISK_INNER_TO_OUTER_RATIO).toBe(0.38)
    expect(WORLD_SPACE_BLACK_HOLE_DISK_INNER_SCALE_HEIGHT).toBe(0.035)
    expect(WORLD_SPACE_BLACK_HOLE_DISK_OUTER_SCALE_HEIGHT).toBe(0.08)
    expect(WORLD_SPACE_BLACK_HOLE_HORIZON_RADIUS).toBeCloseTo(0.87984, 6)
    expect(
      WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS
      * WORLD_SPACE_BLACK_HOLE_HORIZON_RADIUS,
    ).toBeCloseTo(WORLD_SPACE_BLACK_HOLE_OUTER_WORLD_RADIUS, 6)
    expect(
      WORLD_SPACE_BLACK_HOLE_DISK_INNER_RADIUS / WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS,
    ).toBeCloseTo(WORLD_SPACE_BLACK_HOLE_DISK_INNER_TO_OUTER_RATIO, 6)
    expect(WORLD_SPACE_BLACK_HOLE_OUTER_WORLD_RADIUS).toBeCloseTo(3.744, 6)
    expect(WORLD_SPACE_BLACK_HOLE_LENSING_MARGIN).toBe(0.65)
    expect(
      WORLD_SPACE_BLACK_HOLE_INTEGRATION_RADIUS - WORLD_SPACE_BLACK_HOLE_DISK_OUTER_RADIUS,
    ).toBeCloseTo(WORLD_SPACE_BLACK_HOLE_LENSING_MARGIN, 6)
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('screenDistance')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('uScreenRadius')
    expect(uniforms.uDiskNormal.value.distanceTo(WORLD_SPACE_BLACK_HOLE_DISK_NORMAL)).toBe(0)
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('reconstructWorldRay')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('uInverseProjectionMatrix')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('uCameraWorldMatrix')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('reconstructWorldPosition')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('isForegroundGeometry')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('uViewProjectionMatrix')
  })

  it('integrates frame dragging, two disk images, and source-free horizon rays', () => {
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('#define MAX_STEPS 144')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('frameDragging')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('verticalDensity')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('volumeSample')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('closestSegmentT')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('firstOpticalDepth')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('firstSegmentComplete')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('secondOpticalDepth')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain(
      'firstColor + (1.0 - firstAlpha) * secondColor',
    )
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('lensingWeight')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('bool crossedDisk')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('if (radius < 1.0)')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('sourceVisibility')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('lensingProximity')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('captured')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('background = vec3(0.0)')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain(
      'if (hasForegroundGeometry) color = originalBackground',
    )
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain(
      'gl_FragColor = vec4(color, 1.0)',
    )
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('geodesicCapture')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('captureMask')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain(
      'vec4(originalBackground, 0.0)',
    )
  })

  it('uses one continuous physical disk volume without synthetic branch geometry', () => {
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('fragmentedArc')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('vec3 photonArc')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('residenceGain')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('horizonMetric')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('(minimumRadius - 1.5)')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('segmentDiskCoverage')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('scaleHeight')
    expect(worldSpaceKerrBlackHoleFragmentShader).toContain('firstOpticalDepth')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('lensedRayStrength')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('lensedImageGain')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('lowerImageGate')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('minorImageBlend')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('minorArcMask')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('diskCrossings')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('enteredDiskVolume')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('skippedDiskVolume')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('secondaryTransmission')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('secondaryLensedArc')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain(
      'sign(dot(cameraLocal, diskNormal))',
    )
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('photonRing')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('criticalOrbitEmission')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('horizontalFlare')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('corona')
    expect(worldSpaceKerrBlackHoleFragmentShader).not.toContain('float annulus')
  })
})

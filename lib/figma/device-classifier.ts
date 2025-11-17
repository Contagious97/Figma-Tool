export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other'

export interface DeviceClassification {
  deviceType: DeviceType
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

export interface DeviceOverride {
  frameId: string
  deviceType: DeviceType
  overriddenAt: Date
  overriddenBy: string // user ID
}

export class DeviceClassifier {
  private readonly MOBILE_KEYWORDS = [
    'mobile',
    'phone',
    'iphone',
    'android',
    'ios',
    'app',
    '375',
    '390',
    '414',
    '360',
  ]

  private readonly TABLET_KEYWORDS = [
    'tablet',
    'ipad',
    'pro',
    '768',
    '834',
    '1024',
  ]

  private readonly DESKTOP_KEYWORDS = [
    'desktop',
    'web',
    'browser',
    '1440',
    '1920',
    '1280',
    '1366',
  ]

  // Standard device dimensions
  private readonly DEVICE_DIMENSIONS = {
    mobile: [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 13/14' },
      { width: 393, height: 852, name: 'iPhone 14 Pro' },
      { width: 414, height: 896, name: 'iPhone 11/XR' },
      { width: 360, height: 640, name: 'Android Small' },
      { width: 412, height: 915, name: 'Android Large' },
    ],
    tablet: [
      { width: 768, height: 1024, name: 'iPad Portrait' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
      { width: 810, height: 1080, name: 'iPad Air' },
      { width: 834, height: 1194, name: 'iPad Pro 11"' },
      { width: 1024, height: 1366, name: 'iPad Pro 12.9"' },
    ],
    desktop: [
      { width: 1280, height: 720, name: 'HD' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1440, height: 900, name: 'MacBook' },
      { width: 1920, height: 1080, name: 'Full HD' },
      { width: 2560, height: 1440, name: '2K' },
    ],
  }

  classify(frame: {
    name: string
    width: number
    height: number
  }): DeviceClassification {
    // Step 1: Check naming patterns (highest confidence)
    const nameClassification = this.classifyByName(frame.name)
    if (nameClassification) {
      return nameClassification
    }

    // Step 2: Check exact dimension matches (high confidence)
    const dimensionClassification = this.classifyByExactDimensions(
      frame.width,
      frame.height
    )
    if (dimensionClassification) {
      return dimensionClassification
    }

    // Step 3: Check aspect ratio and size (medium confidence)
    const aspectRatioClassification = this.classifyByAspectRatio(
      frame.width,
      frame.height
    )

    return aspectRatioClassification
  }

  private classifyByName(name: string): DeviceClassification | null {
    const lowerName = name.toLowerCase()

    // Check mobile keywords
    for (const keyword of this.MOBILE_KEYWORDS) {
      if (lowerName.includes(keyword)) {
        return {
          deviceType: 'mobile',
          confidence: 'high',
          reason: `Name contains mobile keyword: "${keyword}"`,
        }
      }
    }

    // Check tablet keywords
    for (const keyword of this.TABLET_KEYWORDS) {
      if (lowerName.includes(keyword)) {
        return {
          deviceType: 'tablet',
          confidence: 'high',
          reason: `Name contains tablet keyword: "${keyword}"`,
        }
      }
    }

    // Check desktop keywords
    for (const keyword of this.DESKTOP_KEYWORDS) {
      if (lowerName.includes(keyword)) {
        return {
          deviceType: 'desktop',
          confidence: 'high',
          reason: `Name contains desktop keyword: "${keyword}"`,
        }
      }
    }

    return null
  }

  private classifyByExactDimensions(
    width: number,
    height: number
  ): DeviceClassification | null {
    const tolerance = 10 // Allow 10px variance

    // Check mobile dimensions
    for (const device of this.DEVICE_DIMENSIONS.mobile) {
      if (
        this.dimensionsMatch(
          width,
          height,
          device.width,
          device.height,
          tolerance
        ) ||
        this.dimensionsMatch(
          width,
          height,
          device.height,
          device.width,
          tolerance
        )
      ) {
        return {
          deviceType: 'mobile',
          confidence: 'high',
          reason: `Matches ${device.name} dimensions`,
        }
      }
    }

    // Check tablet dimensions
    for (const device of this.DEVICE_DIMENSIONS.tablet) {
      if (
        this.dimensionsMatch(
          width,
          height,
          device.width,
          device.height,
          tolerance
        ) ||
        this.dimensionsMatch(
          width,
          height,
          device.height,
          device.width,
          tolerance
        )
      ) {
        return {
          deviceType: 'tablet',
          confidence: 'high',
          reason: `Matches ${device.name} dimensions`,
        }
      }
    }

    // Check desktop dimensions
    for (const device of this.DEVICE_DIMENSIONS.desktop) {
      if (
        this.dimensionsMatch(
          width,
          height,
          device.width,
          device.height,
          tolerance
        ) ||
        this.dimensionsMatch(
          width,
          height,
          device.height,
          device.width,
          tolerance
        )
      ) {
        return {
          deviceType: 'desktop',
          confidence: 'high',
          reason: `Matches ${device.name} dimensions`,
        }
      }
    }

    return null
  }

  private dimensionsMatch(
    w1: number,
    h1: number,
    w2: number,
    h2: number,
    tolerance: number
  ): boolean {
    return Math.abs(w1 - w2) <= tolerance && Math.abs(h1 - h2) <= tolerance
  }

  private classifyByAspectRatio(
    width: number,
    height: number
  ): DeviceClassification {
    const aspectRatio = width / height

    // Portrait mobile: tall and narrow
    if (aspectRatio < 0.6 || (aspectRatio < 1 && width <= 480)) {
      return {
        deviceType: 'mobile',
        confidence: 'medium',
        reason: `Portrait aspect ratio (${aspectRatio.toFixed(2)}) suggests mobile`,
      }
    }

    // Landscape mobile: short and wide but small
    if (aspectRatio > 1.5 && width <= 900 && height <= 480) {
      return {
        deviceType: 'mobile',
        confidence: 'medium',
        reason: 'Landscape mobile dimensions',
      }
    }

    // Tablet: medium size, various ratios
    if (
      (width >= 700 && width <= 1100 && height >= 700) ||
      (height >= 700 && height <= 1100 && width >= 700)
    ) {
      return {
        deviceType: 'tablet',
        confidence: 'medium',
        reason: 'Dimensions suggest tablet',
      }
    }

    // Desktop: wide and large
    if (width >= 1200 || (aspectRatio >= 1.3 && width >= 1000)) {
      return {
        deviceType: 'desktop',
        confidence: 'medium',
        reason: 'Wide dimensions suggest desktop',
      }
    }

    // Can't determine
    return {
      deviceType: 'other',
      confidence: 'low',
      reason: 'Could not determine device type from dimensions',
    }
  }

  // Batch classify frames
  classifyFrames(
    frames: Array<{ id: string; name: string; width: number; height: number }>
  ): Map<string, DeviceClassification> {
    const classifications = new Map<string, DeviceClassification>()

    for (const frame of frames) {
      classifications.set(frame.id, this.classify(frame))
    }

    return classifications
  }
}

export class DeviceClassifierWithOverrides extends DeviceClassifier {
  constructor(private overrides: Map<string, DeviceOverride>) {
    super()
  }

  classifyWithOverrides(frame: {
    id: string
    name: string
    width: number
    height: number
  }): DeviceClassification {
    // Check for user override first
    const override = this.overrides.get(frame.id)

    if (override) {
      return {
        deviceType: override.deviceType,
        confidence: 'high',
        reason: 'User override',
      }
    }

    // Fall back to automatic classification
    return this.classify(frame)
  }
}

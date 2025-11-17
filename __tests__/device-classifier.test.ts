import { DeviceClassifier } from '@/lib/figma/device-classifier'

describe('DeviceClassifier', () => {
  const classifier = new DeviceClassifier()

  // Mobile tests
  test('classifies iPhone 13 by dimensions', () => {
    const result = classifier.classify({
      name: 'Home Screen',
      width: 390,
      height: 844,
    })
    expect(result.deviceType).toBe('mobile')
    expect(result.confidence).toBe('high')
  })

  test('classifies by mobile keyword in name', () => {
    const result = classifier.classify({
      name: 'Mobile - Home',
      width: 400,
      height: 800,
    })
    expect(result.deviceType).toBe('mobile')
    expect(result.confidence).toBe('high')
  })

  test('classifies portrait aspect ratio as mobile', () => {
    const result = classifier.classify({
      name: 'Screen 1',
      width: 350,
      height: 700,
    })
    expect(result.deviceType).toBe('mobile')
    expect(result.confidence).toBe('medium')
  })

  test('classifies iPhone SE by dimensions', () => {
    const result = classifier.classify({
      name: 'Login',
      width: 375,
      height: 667,
    })
    expect(result.deviceType).toBe('mobile')
    expect(result.confidence).toBe('high')
  })

  test('classifies Android device by dimensions', () => {
    const result = classifier.classify({
      name: 'Dashboard',
      width: 360,
      height: 640,
    })
    expect(result.deviceType).toBe('mobile')
    expect(result.confidence).toBe('high')
  })

  // Tablet tests
  test('classifies iPad by dimensions', () => {
    const result = classifier.classify({
      name: 'Dashboard',
      width: 768,
      height: 1024,
    })
    expect(result.deviceType).toBe('tablet')
    expect(result.confidence).toBe('high')
  })

  test('classifies iPad landscape by dimensions', () => {
    const result = classifier.classify({
      name: 'Dashboard',
      width: 1024,
      height: 768,
    })
    expect(result.deviceType).toBe('tablet')
    expect(result.confidence).toBe('high')
  })

  test('classifies by tablet keyword in name', () => {
    const result = classifier.classify({
      name: 'iPad - Settings',
      width: 800,
      height: 1000,
    })
    expect(result.deviceType).toBe('tablet')
    expect(result.confidence).toBe('high')
  })

  // Desktop tests
  test('classifies desktop by dimensions', () => {
    const result = classifier.classify({
      name: 'Homepage',
      width: 1920,
      height: 1080,
    })
    expect(result.deviceType).toBe('desktop')
    expect(result.confidence).toBe('high')
  })

  test('classifies MacBook dimensions as desktop', () => {
    const result = classifier.classify({
      name: 'Dashboard',
      width: 1440,
      height: 900,
    })
    expect(result.deviceType).toBe('desktop')
    expect(result.confidence).toBe('high')
  })

  test('classifies by desktop keyword', () => {
    const result = classifier.classify({
      name: 'Desktop - Dashboard',
      width: 1200,
      height: 800,
    })
    expect(result.deviceType).toBe('desktop')
    expect(result.confidence).toBe('high')
  })

  test('classifies wide dimensions as desktop', () => {
    const result = classifier.classify({
      name: 'Homepage',
      width: 1366,
      height: 768,
    })
    expect(result.deviceType).toBe('desktop')
    expect(result.confidence).toBe('high')
  })

  // Edge cases
  test('handles landscape mobile', () => {
    const result = classifier.classify({
      name: 'Game Screen',
      width: 800,
      height: 375,
    })
    expect(result.deviceType).toBe('mobile')
  })

  test('handles unusual dimensions as other', () => {
    const result = classifier.classify({
      name: 'Custom',
      width: 500,
      height: 500,
    })
    expect(result.deviceType).toBe('other')
  })

  test('handles very small dimensions', () => {
    const result = classifier.classify({
      name: 'Widget',
      width: 200,
      height: 300,
    })
    expect(result.deviceType).toBe('mobile')
  })

  test('classifies by iPhone keyword', () => {
    const result = classifier.classify({
      name: 'iPhone 14 - Home',
      width: 400,
      height: 850,
    })
    expect(result.deviceType).toBe('mobile')
    expect(result.confidence).toBe('high')
  })

  test('classifies by web keyword as desktop', () => {
    const result = classifier.classify({
      name: 'Web Dashboard',
      width: 1200,
      height: 800,
    })
    expect(result.deviceType).toBe('desktop')
    expect(result.confidence).toBe('high')
  })

  // Batch classification tests
  test('batch classifies multiple frames', () => {
    const frames = [
      { id: '1', name: 'Mobile Home', width: 375, height: 667 },
      { id: '2', name: 'Tablet Dashboard', width: 768, height: 1024 },
      { id: '3', name: 'Desktop Homepage', width: 1920, height: 1080 },
    ]

    const results = classifier.classifyFrames(frames)

    expect(results.get('1')?.deviceType).toBe('mobile')
    expect(results.get('2')?.deviceType).toBe('tablet')
    expect(results.get('3')?.deviceType).toBe('desktop')
  })
})

export interface DeviceCapabilities {
  maxMessagesPerFrame: number;
  processTime: number;
  highPriorityProcessTime: number;
  usePerformanceMode: boolean;
}

// Default values for different device tiers
const DEVICE_TIERS = {
  high: {
    maxMessagesPerFrame: 25,
    processTime: 16,
    highPriorityProcessTime: 8,
    usePerformanceMode: true
  },
  medium: {
    maxMessagesPerFrame: 15,
    processTime: 20,
    highPriorityProcessTime: 10,
    usePerformanceMode: true
  },
  low: {
    maxMessagesPerFrame: 8,
    processTime: 33, // ~30fps
    highPriorityProcessTime: 16,
    usePerformanceMode: true
  }
} as const;

function measureDevicePerformance(): Promise<number> {
  return new Promise((resolve) => {
    const iterations = 10000;
    const start = performance.now();

    // Perform some CPU-intensive operations
    for (let i = 0; i < iterations; i++) {
      Math.sqrt(Math.random() * 10000);
    }

    const duration = performance.now() - start;
    resolve(duration);
  });
}

async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return DEVICE_TIERS.medium;
  }

  try {
    // Measure device performance
    const performanceScore = await measureDevicePerformance();

    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency || 2;

    // Check device memory (if available)
    const memory = (navigator as Navigator & { deviceMemory: number }).deviceMemory || 4;

    // Calculate device tier
    if (
      performanceScore < 50 && // Fast execution
      cores >= 4 &&
      memory >= 4
    ) {
      return DEVICE_TIERS.high;
    }
    if (performanceScore < 100 && cores >= 2 && memory >= 2) {
      return DEVICE_TIERS.medium;
    }

    return DEVICE_TIERS.low;
  } catch (error) {
    console.warn('Error detecting device capabilities:', error);
    return DEVICE_TIERS.medium; // Fallback to medium tier
  }
}

// Cache capabilities
let cachedCapabilities: DeviceCapabilities | null = null;

export async function getDeviceCapabilities(): Promise<DeviceCapabilities> {
  if (!cachedCapabilities) {
    cachedCapabilities = await detectDeviceCapabilities();
  }
  return cachedCapabilities;
}

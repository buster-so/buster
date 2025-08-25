// Simple in-memory cache for report snapshots to avoid repeated DB queries
// during sequential report modifications (create → modify → modify pattern)

type VersionHistoryEntry = {
  content: string;
  updated_at: string;
  version_number: number;
};

type VersionHistory = Record<string, VersionHistoryEntry>;

type CachedSnapshot = {
  content: string;
  versionHistory: VersionHistory | null;
  timestamp: number;
};

// Simple in-memory cache - no LRU, just a Map
const reportSnapshots = new Map<string, CachedSnapshot>();

// 5 minute expiry
const CACHE_TTL = 5 * 60 * 1000;

export function getCachedSnapshot(reportId: string): {
  content: string;
  versionHistory: VersionHistory | null;
} | null {
  const cached = reportSnapshots.get(reportId);

  // Check if exists and not expired
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.info('[report-cache] Cache hit', {
      reportId,
      age: `${Math.round((Date.now() - cached.timestamp) / 1000)}s`,
    });
    return {
      content: cached.content,
      versionHistory: cached.versionHistory,
    };
  }

  // Expired or not found
  if (cached) {
    console.info('[report-cache] Cache expired, removing', { reportId });
    reportSnapshots.delete(reportId);
  }
  return null;
}

export function updateCachedSnapshot(
  reportId: string,
  content: string,
  versionHistory: VersionHistory | null
): void {
  reportSnapshots.set(reportId, {
    content,
    versionHistory,
    timestamp: Date.now(),
  });
  console.info('[report-cache] Updated cache', {
    reportId,
    contentLength: content.length,
    cacheSize: reportSnapshots.size,
  });
}

// Clear old entries periodically to prevent memory bloat
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, data] of reportSnapshots.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      reportSnapshots.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.info('[report-cache] Cleanup completed', {
      entriesRemoved: cleaned,
      remainingEntries: reportSnapshots.size,
    });
  }
}, CACHE_TTL); // Run cleanup every 5 minutes

// Prevent the interval from keeping the process alive
cleanupInterval.unref?.();

// Export a function to clear the cache if needed (e.g., for testing)
export function clearReportCache(): void {
  reportSnapshots.clear();
  console.info('[report-cache] Cache cleared');
}

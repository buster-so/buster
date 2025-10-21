/**
 * UI Constants - Single source of truth for colors, spacing, and display limits
 */
export const UI_CONSTANTS = {
  COLORS: {
    TEXT_PRIMARY: '#e0e7ff',
    TEXT_SECONDARY: '#94a3b8',
    TEXT_DIM: '#64748b',
    SUCCESS: '#10b981',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    USER_PROMPT: '#a855f7',
  },
  TOOL_COLORS: {
    EXECUTE: '#d97706',  // Amber/orange - good contrast with white
    WRITE: '#c026d3',    // Fuchsia - good contrast with white
    READ: '#2563eb',     // Blue - good contrast with white
    UPDATE: '#0891b2',   // Cyan - good contrast with white
  },
  LINE_LIMITS: {
    DEFAULT_PREVIEW: 5,
    DIFF_PREVIEW: 10,
  },
  PADDING: {
    INDENT: 2,
  },
} as const;

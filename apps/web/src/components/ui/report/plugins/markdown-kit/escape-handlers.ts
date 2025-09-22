// Helper function to escape HTML entities for attribute values
export const escapeHtmlAttribute = (str: string): string => {
  return str
    .replace(/&/g, '&amp;') // Must be first to avoid double-encoding
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Helper function to unescape HTML entities
export const unescapeHtmlAttribute = (str: string): string => {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'") // Handle alternative apostrophe encoding
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // Must be last to avoid double-decoding
};

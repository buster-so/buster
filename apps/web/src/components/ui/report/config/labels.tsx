export const NodeTypeLabels = {
  metric: {
    label: 'Metric',
    keyboard: undefined,
    keywords: ['metric', 'chart', 'charts', 'graph', 'report']
  },
  // Block types
  paragraph: {
    label: 'Text',
    keyboard: undefined,
    keywords: ['paragraph']
  },
  h1: {
    label: 'Heading 1',
    keyboard: undefined,
    keywords: ['title', 'h1']
  },
  h2: {
    label: 'Heading 2',
    keyboard: undefined,
    keywords: ['subtitle', 'h2']
  },
  h3: {
    label: 'Heading 3',
    keyboard: undefined,
    keywords: ['subtitle', 'h3']
  },
  h4: {
    label: 'Heading 4',
    keyboard: undefined,
    keywords: ['subtitle', 'h4']
  },
  h5: {
    label: 'Heading 5',
    keyboard: undefined,
    keywords: ['subtitle', 'h5']
  },
  h6: {
    label: 'Heading 6',
    keyboard: undefined,
    keywords: ['subtitle', 'h6']
  },
  bulletedList: {
    label: 'Bulleted list',
    keyboard: undefined,
    keywords: ['unordered', 'ul', '-']
  },
  numberedList: {
    label: 'Numbered list',
    keyboard: undefined,
    keywords: ['ordered', 'ol', '1']
  },
  todoList: {
    label: 'To-do list',
    keyboard: undefined,
    keywords: ['checklist', 'task', 'checkbox', '[]']
  },
  toggleList: {
    label: 'Toggle list',
    keyboard: undefined,
    keywords: ['collapsible', 'expandable']
  },
  codeBlock: {
    label: 'Code',
    keyboard: undefined,
    keywords: ['```']
  },
  blockquote: {
    label: 'Quote',
    keyboard: undefined,
    keywords: ['citation', 'blockquote', '>']
  },
  columnsThree: {
    label: '3 columns',
    keyboard: undefined,
    keywords: ['three', '3', 'columns']
  },

  // Text formatting
  bold: {
    label: 'Bold',
    keyboard: '⌘+B',
    keywords: []
  },
  italic: {
    label: 'Italic',
    keyboard: '⌘+I',
    keywords: []
  },
  underline: {
    label: 'Underline',
    keyboard: '⌘+U',
    keywords: []
  },
  strikethrough: {
    label: 'Strikethrough',
    keyboard: '⌘+⇧+M',
    keywords: []
  },
  code: {
    label: 'Code',
    keyboard: '⌘+E',
    keywords: []
  },
  highlight: {
    label: 'Highlight',
    keyboard: undefined,
    keywords: []
  },
  textColor: {
    label: 'Text color',
    keyboard: undefined,
    keywords: []
  },
  backgroundColor: {
    label: 'Background color',
    keyboard: undefined,
    keywords: []
  },

  // Actions
  undo: {
    label: 'Undo',
    keyboard: '⌘+Z',
    keywords: []
  },
  redo: {
    label: 'Redo',
    keyboard: '⌘+⇧+Z',
    keywords: []
  },
  delete: {
    label: 'Delete',
    keyboard: '⌘+⌫',
    keywords: []
  },
  duplicate: {
    label: 'Duplicate',
    keyboard: undefined,
    keywords: []
  },
  askAI: {
    label: 'Ask AI',
    keyboard: undefined,
    keywords: []
  },
  link: {
    label: 'Link',
    keyboard: '⌘+K',
    keywords: []
  },
  formatCode: {
    label: 'Format code',
    keyboard: undefined,
    keywords: []
  },
  copy: {
    label: 'Copy',
    keyboard: undefined,
    keywords: []
  },
  plainText: {
    label: 'Plain text',
    keyboard: undefined,
    keywords: []
  },
  searchLanguage: {
    label: 'Search language...',
    keyboard: undefined,
    keywords: []
  },
  noLanguageFound: {
    label: 'No language found.',
    keyboard: undefined,
    keywords: []
  },

  // Structure
  turnInto: {
    label: 'Turn into',
    keyboard: undefined,
    keywords: []
  },
  align: {
    label: 'Align',
    keyboard: undefined,
    keywords: []
  },
  indentation: {
    label: 'Indentation',
    keyboard: undefined,
    keywords: ['indent', 'outdent']
  },
  insert: {
    label: 'Insert',
    keyboard: undefined,
    keywords: []
  },
  indent: {
    label: 'Indent',
    keyboard: '⇥',
    keywords: []
  },
  outdent: {
    label: 'Outdent',
    keyboard: '⇧+⇥',
    keywords: []
  },

  // Tools
  table: {
    label: 'Table',
    keyboard: undefined,
    keywords: []
  },
  emoji: {
    label: 'Emoji',
    keyboard: undefined,
    keywords: []
  },
  equation: {
    label: 'Equation',
    keyboard: undefined,
    keywords: []
  },
  addTexEquation: {
    label: 'Add a Tex equation',
    keyboard: undefined,
    keywords: []
  },
  newEquation: {
    label: 'New equation',
    keyboard: undefined,
    keywords: []
  },
  done: {
    label: 'Done',
    keyboard: undefined,
    keywords: []
  },
  comment: {
    label: 'Comment',
    keyboard: '⌘+⇧+C',
    keywords: []
  },

  // Lists
  todo: {
    label: 'Todo',
    keyboard: undefined,
    keywords: []
  },
  toggle: {
    label: 'Toggle',
    keyboard: undefined,
    keywords: []
  },

  // Media
  audio: {
    label: 'Audio',
    keyboard: undefined,
    keywords: ['sound', 'mp3', 'wav', 'music']
  },
  video: {
    label: 'Video',
    keyboard: undefined,
    keywords: ['mp4', 'movie', 'film']
  },
  image: {
    label: 'Image',
    keyboard: undefined,
    keywords: ['photo', 'picture', 'jpg', 'png', 'gif']
  },
  file: {
    label: 'File',
    keyboard: undefined,
    keywords: ['document', 'pdf', 'attachment']
  },
  insertAudio: {
    label: 'Insert Audio',
    keyboard: undefined,
    keywords: []
  },
  insertVideo: {
    label: 'Insert Video',
    keyboard: undefined,
    keywords: []
  },
  insertImage: {
    label: 'Insert Image',
    keyboard: undefined,
    keywords: []
  },
  insertFile: {
    label: 'Insert File',
    keyboard: undefined,
    keywords: []
  },
  uploadFromComputer: {
    label: 'Upload from computer',
    keyboard: undefined,
    keywords: []
  },
  insertViaUrl: {
    label: 'Insert via URL',
    keyboard: undefined,
    keywords: []
  },
  editLink: {
    label: 'Edit link',
    keyboard: undefined,
    keywords: []
  },
  editMetric: {
    label: 'Edit metric',
    keyboard: undefined,
    keywords: []
  },
  caption: {
    label: 'Caption',
    keyboard: undefined,
    keywords: []
  },
  pasteEmbedLink: {
    label: 'Paste the embed link...',
    keyboard: undefined,
    keywords: []
  },
  addAudioFile: {
    label: 'Add an audio file',
    keyboard: undefined,
    keywords: []
  },
  addFile: {
    label: 'Add a file',
    keyboard: undefined,
    keywords: []
  },
  addImage: {
    label: 'Add an image',
    keyboard: undefined,
    keywords: []
  },
  addVideo: {
    label: 'Add a video',
    keyboard: undefined,
    keywords: []
  },
  addMediaEmbed: {
    label: 'Add a media embed',
    keyboard: undefined,
    keywords: []
  },

  // Import/Export
  export: {
    label: 'Export',
    keyboard: undefined,
    keywords: []
  },
  import: {
    label: 'Import',
    keyboard: undefined,
    keywords: []
  },
  importFromHtml: {
    label: 'Import from HTML',
    keyboard: undefined,
    keywords: []
  },
  importFromMarkdown: {
    label: 'Import from Markdown',
    keyboard: undefined,
    keywords: []
  },
  exportAsHtml: {
    label: 'Export as HTML',
    keyboard: undefined,
    keywords: []
  },
  exportAsPdf: {
    label: 'Export as PDF',
    keyboard: undefined,
    keywords: []
  },
  exportAsImage: {
    label: 'Export as Image',
    keyboard: undefined,
    keywords: []
  },
  exportAsMarkdown: {
    label: 'Export as Markdown',
    keyboard: undefined,
    keywords: []
  },
  pdfExportedSuccessfully: {
    label: 'PDF exported successfully',
    keyboard: undefined,
    keywords: []
  },
  failedToExportPdf: {
    label: 'Failed to export PDF',
    keyboard: undefined,
    keywords: []
  },
  imageExportedSuccessfully: {
    label: 'Image exported successfully',
    keyboard: undefined,
    keywords: []
  },
  failedToExportImage: {
    label: 'Failed to export image',
    keyboard: undefined,
    keywords: []
  },
  htmlExportedSuccessfully: {
    label: 'HTML exported successfully',
    keyboard: undefined,
    keywords: []
  },
  failedToExportHtml: {
    label: 'Failed to export HTML',
    keyboard: undefined,
    keywords: []
  },
  markdownExportedSuccessfully: {
    label: 'Markdown exported successfully',
    keyboard: undefined,
    keywords: []
  },
  failedToExportMarkdown: {
    label: 'Failed to export Markdown',
    keyboard: undefined,
    keywords: []
  },

  // Layout
  lineHeight: {
    label: 'Line height',
    keyboard: undefined,
    keywords: []
  },
  fontSize: {
    label: 'Font size',
    keyboard: undefined,
    keywords: []
  },

  // Modes
  mode: {
    label: 'Editing mode',
    keyboard: undefined,
    keywords: []
  },
  suggestion: {
    label: 'Suggestion edits',
    keyboard: undefined,
    keywords: []
  },
  suggestionOff: {
    label: 'Turn off suggesting',
    keyboard: undefined,
    keywords: []
  },

  // More menu items
  keyboardInput: {
    label: 'Keyboard input',
    keyboard: undefined,
    keywords: []
  },
  superscript: {
    label: 'Superscript',
    keyboard: '⌘+,',
    keywords: []
  },
  subscript: {
    label: 'Subscript',
    keyboard: '⌘+.',
    keywords: []
  },

  // AI
  ai: {
    label: 'AI commands',
    keyboard: undefined,
    keywords: []
  },
  aiChat: {
    label: 'AI',
    keyboard: undefined,
    keywords: []
  },
  callout: {
    label: 'Callout',
    keyboard: undefined,
    keywords: ['note']
  },

  // More
  more: {
    label: 'More',
    keyboard: undefined,
    keywords: []
  },

  // Alignment options
  alignLeft: {
    label: 'Align left',
    keyboard: undefined,
    keywords: []
  },
  alignCenter: {
    label: 'Align center',
    keyboard: undefined,
    keywords: []
  },
  alignRight: {
    label: 'Align right',
    keyboard: undefined,
    keywords: []
  },
  alignJustify: {
    label: 'Justify',
    keyboard: undefined,
    keywords: []
  },

  // Additional insert items
  divider: {
    label: 'Divider',
    keyboard: undefined,
    keywords: []
  },
  embed: {
    label: 'Embed',
    keyboard: undefined,
    keywords: []
  },
  tableOfContents: {
    label: 'Table of contents',
    keyboard: undefined,
    keywords: ['toc']
  },
  date: {
    label: 'Date',
    keyboard: undefined,
    keywords: ['time']
  },
  inlineEquation: {
    label: 'Inline Equation',
    keyboard: undefined,
    keywords: []
  }
} as const;

// Group labels for menus
export const MenuGroupLabels = {
  basicBlocks: 'Basic blocks',
  lists: 'Lists',
  media: 'Media',
  advancedBlocks: 'Advanced blocks',
  inline: 'Inline'
} as const;

export const createLabel = (type: keyof typeof NodeTypeLabels, includeKeyboard = true) => {
  const config = NodeTypeLabels[type];
  if (includeKeyboard && config.keyboard) {
    return `${config.label} (${config.keyboard})`;
  }
  return config.label;
};

// Helper to create menu items from label config
export const createMenuItem = (
  type: keyof typeof NodeTypeLabels,
  value: string,
  icon: React.ReactNode
) => {
  const config = NodeTypeLabels[type];
  return {
    icon,
    label: config.label,
    keywords: config.keywords,
    value
  };
};

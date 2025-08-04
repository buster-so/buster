import {
  // Text formatting
  TextBold,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  TextColor2,
  BucketPaint2,
  TextHighlight2,
  Code2,
  Code,

  // Headings
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,

  // Lists
  UnorderedList,
  OrderedList,
  SquareCode,

  // Structure
  Pilcrow,
  Quote,
  ChevronRight,
  GridLayoutCols3,

  // Table
  Table,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Merge,
  Ungroup,
  Trash2,
  Xmark,
  Merge3,
  Eraser,
  Grid2X2,
  SquareLayoutGrid4,
  SquareLayoutGrid,

  // Media
  Image as ImageIcon,
  Film,
  FileCloud,
  VolumeUp,
  FilmPlay,
  ImageSparkle,
  Loader,

  // Actions
  WandSparkle,
  ArrowDownFromLine,
  ArrowUpFromLine,
  ArrowUpToLine,
  Link2,
  Plus,
  Minus,
  Undo,
  Redo,
  GripDotsVertical,
  ExternalLink,
  Link,
  TextA,
  Link5Slash,
  Dots,
  Download,
  Keyboard,
  Subscript,
  Superscript,
  Check,
  Copy2,
  BracketsCurly,
  Upload,

  // Tools
  Equation,
  Calendar,
  ShapeSquare,
  Book2,
  Sparkle2,
  SearchContent,
  BulletList,
  ListTodo,
  SelectDropdown,
  TextColumns,
  IndentIncrease,
  IndentDecrease,
  TextTool2,

  // Emoji
  FaceGrin,
  Apple,
  Flag,
  Magnifier,
  Leaf,
  Lightbulb,
  Music,
  Star,
  Clock,
  Compass,
  BallRugby,

  // Alignment
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,

  // Math
  MathFunction,
  RectArrowDownLeft
} from '@/components/ui/icons';

export const NodeTypeIcons = {
  // Text formatting
  bold: TextBold,
  italic: TextItalic,
  underline: TextUnderline,
  strikethrough: TextStrikethrough,
  code: Code2,
  textColor: TextColor2,
  backgroundColor: BucketPaint2,
  highlight: TextHighlight2,

  // Headings
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  h5: Heading5,
  h6: Heading6,

  // Lists
  bulletedList: UnorderedList,
  numberedList: OrderedList,
  todoList: ListTodo,
  checkList: SquareCode,

  // Structure
  paragraph: Pilcrow,
  quote: Quote,
  toggle: ChevronRight,
  columnsThree: GridLayoutCols3,

  // Table
  table: Table,
  tableGrid: Grid3X3,
  tableArrowUp: ArrowUp,
  tableArrowDown: ArrowDown,
  tableArrowLeft: ArrowLeft,
  tableArrowRight: ArrowRight,
  tableMerge: Merge,
  tableUngroup: Ungroup,
  tableDelete: Trash2,
  tableRemove: Xmark,
  tableMergeCells: Merge3,
  tableEraser: Eraser,
  tableInsertGrid: Grid2X2,
  tableSplitCell: SquareLayoutGrid4,
  tableBorders: SquareLayoutGrid,

  // Media
  image: ImageIcon,
  video: Film,
  embed: Code2,
  file: FileCloud,
  audio: VolumeUp,
  upload: Upload,
  filmPlay: FilmPlay,
  imageSparkle: ImageSparkle,
  loader: Loader,

  // Actions
  ai: WandSparkle,
  export: ArrowDownFromLine,
  import: ArrowUpFromLine,
  link: Link2,
  add: Plus,
  remove: Minus,
  undo: Undo,
  redo: Redo,
  gripVertical: GripDotsVertical,
  externalLink: ExternalLink,
  linkIcon: Link,
  textLink: TextA,
  unlink: Link5Slash,
  moreHorizontal: Dots,
  keyboard: Keyboard,
  subscript: Subscript,
  superscript: Superscript,
  trash: Trash2,
  check: Check,
  copy: Copy2,
  formatCode: BracketsCurly,
  indent: IndentIncrease,
  outdent: IndentDecrease,
  download: Download,
  turnInto: Pilcrow,

  // Tools
  equation: Equation,
  calendar: Calendar,
  shape: ShapeSquare,
  tableOfContents: Book2,
  codeBlock: Code,
  sparkleAI: Sparkle2,
  searchContent: SearchContent,
  bulletList: BulletList,
  checkListSquare: SquareCode,
  selectDropdown: SelectDropdown,
  textColumns: TextColumns,
  callout: Lightbulb,

  // Emoji
  emoji: FaceGrin,
  emojiApple: Apple,
  emojiFlag: Flag,
  emojiSearch: Magnifier,
  emojiLeaf: Leaf,
  emojiLightbulb: Lightbulb,
  emojiMusic: Music,
  emojiStar: Star,
  emojiClock: Clock,
  emojiCompass: Compass,
  emojiBall: BallRugby,

  // Alignment
  alignLeft: TextAlignLeft,
  alignCenter: TextAlignCenter,
  alignRight: TextAlignRight,
  alignJustify: TextAlignJustify,

  // Math
  mathFunction: MathFunction,

  // Layout
  lineHeight: TextTool2,

  // Navigation
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  close: Xmark
} as const;

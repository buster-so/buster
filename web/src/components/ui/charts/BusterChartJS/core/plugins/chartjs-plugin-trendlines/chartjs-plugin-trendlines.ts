// chartjs-plugin-trendline.ts

import type { ChartDataset, ChartType, Plugin, Point, Scale } from 'chart.js';
import { DEFAULT_TRENDLINE_CONFIG } from '@/api/asset_interfaces/metric/defaults';
import { defaultLabelOptionConfig } from '../../../hooks/useChartSpecificOptions/labelOptionConfig';

/** The three trendline modes we support */
export type TrendlineType =
  | 'average'
  | 'linear_regression'
  | 'logarithmic_regression'
  | 'exponential_regression'
  | 'polynomial_regression'
  | 'min'
  | 'max'
  | 'median';

/** Options for the slope label */
export interface TrendlineLabelOptions {
  display?: boolean;
  /** Label text or a callback that receives the slope value and returns a string */
  text?:
    | string
    | ((d: {
        slope: number;
        minY: number;
        maxY: number;
        minX: number;
        maxX: number;
        averageY: number;
        medianY: number;
      }) => string);
  /** Whether to display the numeric value of the slope */
  offset?: number;
  percentage?: boolean;
  font?: {
    family?: string;
    size?: number;
    weight?: string | number;
  };
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  positionRatio?: number; // 0 = start, 0.5 = middle, 1 = end
}

/** The full set of options available on each dataset */
export interface TrendlineOptions {
  show?: boolean;
  /** Which regression to use */
  type: TrendlineType;

  /** Only used when type = 'polynomial' */
  polynomialOrder?: number;

  /** Extend the trendline to intercept if slope < 0 */
  projection?: boolean;

  /** Line width and dash style */
  width?: number;
  lineStyle?: 'solid' | 'dotted' | 'dashed' | 'dashdot';

  /** Gradient endpoints */
  colorMin?: string | null;
  colorMax?: string | null;

  /** Fill under the trendline (color or `true` for default) */
  fillColor?: string | boolean;

  /** Label styling */
  label?: TrendlineLabelOptions;
}

export type AggregateMultiple = TrendlineOptions & { yAxisKey: string; yAxisID: string };

/** Plugin-level options */
export interface TrendlinePluginOptions {
  /** Aggregate data points from all datasets into a single trendline */
  aggregateMultiple?: AggregateMultiple[];
}

declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    trendline?: TrendlinePluginOptions;
  }

  interface ChartDatasetProperties<TType extends ChartType, TData> {
    trendline?: TrendlineOptions[];
  }
}

/** Type for trendline coordinate points */
interface TrendlineCoordinates {
  minX: number;
  maxX: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  slope: number;
}

/** Minimal interface to fit points and predict y for any x */
abstract class BaseFitter {
  public minx = Number.POSITIVE_INFINITY;
  public maxx = Number.NEGATIVE_INFINITY;
  public maxY = Number.NEGATIVE_INFINITY;
  public minY = Number.POSITIVE_INFINITY;
  public averageY = 0;
  public medianY = 0;
  protected computed = false;
  protected cache: Map<number, number> = new Map();

  add(x: number, y: number) {
    this.addPoint(x, y);
    this.computed = false;
    this.minx = Math.min(this.minx, x);
    this.maxx = Math.max(this.maxx, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
  }

  protected abstract addPoint(x: number, y: number): void;

  f(x: number): number {
    // Check if value is in cache
    const cachedValue = this.cache.get(x);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    if (!this.computed) {
      this.computeStatistics();
    }

    // Calculate value and store in cache
    const value = this.calculateValue(x);
    this.cache.set(x, value);
    return value;
  }

  // To be implemented by derived classes
  protected abstract calculateValue(x: number): number;

  // Pre-compute any statistics needed (to be called once after all points are added)
  public computeStatistics(): void {
    this.computed = true;
  }

  // Clear cache when data changes
  clearCache(): void {
    this.cache.clear();
    this.computed = false;
  }
}

/** 1st-order least squares */
class LinearFitter extends BaseFitter {
  private sumx = 0;
  private sumy = 0;
  private sumx2 = 0;
  private sumxy = 0;
  private count = 0;
  private _slope: number | null = null;
  private _intercept: number | null = null;

  protected addPoint(x: number, y: number) {
    this.sumx += x;
    this.sumy += y;
    this.sumx2 += x * x;
    this.sumxy += x * y;
    this.count++;
    this._slope = null;
    this._intercept = null;
  }

  public computeStatistics(): void {
    super.computeStatistics();
    this.slope();
    this.intercept();
  }

  private slope(): number {
    if (this._slope === null) {
      const denom = this.count * this.sumx2 - this.sumx * this.sumx;
      this._slope = (this.count * this.sumxy - this.sumx * this.sumy) / denom;
    }
    return this._slope;
  }

  private intercept(): number {
    if (this._intercept === null) {
      this._intercept = (this.sumy - this.slope() * this.sumx) / this.count;
    }
    return this._intercept;
  }

  protected calculateValue(x: number): number {
    return this.slope() * x + this.intercept();
  }
}

/** Fit y = a + b·ln(x) */
class LogarithmicFitter extends BaseFitter {
  private lin = new LinearFitter();

  protected addPoint(x: number, y: number) {
    if (x > 0) {
      const lx = Math.log(x);
      this.lin.add(lx, y);
    }
  }

  public computeStatistics(): void {
    super.computeStatistics();
    this.lin.computeStatistics();
  }

  protected calculateValue(x: number): number {
    if (x <= 0) return Number.NaN;
    return this.lin.f(Math.log(x));
  }
}

/** n-degree polynomial via normal equations + Gaussian elimination */
class PolynomialFitter extends BaseFitter {
  private xs: number[] = [];
  private ys: number[] = [];
  private coeffs: number[] | null = null;

  constructor(private order: number) {
    super();
  }

  protected addPoint(x: number, y: number) {
    this.xs.push(x);
    this.ys.push(y);
    this.coeffs = null; // invalidate previous fit
  }

  public computeStatistics(): void {
    super.computeStatistics();
    // biome-ignore lint: It is okay to focus this test
    if (!this.coeffs) this.fit();
  }

  /** Build and solve the normal equations A·a = b */
  private fit(): void {
    const m = this.order;

    // Pre-compute powers of x for performance
    const xPowers: number[][] = [];
    for (const x of this.xs) {
      const powers = [1]; // x^0 = 1
      for (let p = 1; p <= 2 * m; p++) {
        powers.push(powers[p - 1] * x);
      }
      xPowers.push(powers);
    }

    // build matrix A (size (m+1)x(m+1)) of ∑ x^(i+j)
    const A: number[][] = Array.from({ length: m + 1 }, () => Array(m + 1).fill(0));
    const b: number[] = Array(m + 1).fill(0);

    // Fill the matrix more efficiently using the pre-computed powers
    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= m; j++) {
        for (let k = 0; k < this.xs.length; k++) {
          A[i][j] += xPowers[k][i + j];
        }
      }

      for (let k = 0; k < this.xs.length; k++) {
        b[i] += this.ys[k] * xPowers[k][i];
      }
    }

    // Gaussian elimination (in-place)
    for (let k = 0; k <= m; k++) {
      // pivot
      const pivot = A[k][k];
      if (Math.abs(pivot) < 1e-12) continue;
      for (let j = k; j <= m; j++) A[k][j] /= pivot;
      b[k] /= pivot;

      // eliminate below
      for (let i = k + 1; i <= m; i++) {
        const factor = A[i][k];
        for (let j = k; j <= m; j++) {
          A[i][j] -= factor * A[k][j];
        }
        b[i] -= factor * b[k];
      }
    }

    // back-substitute
    const a = Array(m + 1).fill(0);
    for (let i = m; i >= 0; i--) {
      let sum = b[i];
      for (let j = i + 1; j <= m; j++) sum -= A[i][j] * a[j];
      a[i] = sum;
    }
    this.coeffs = a;
  }

  protected calculateValue(x: number): number {
    // biome-ignore lint: This is a test
    if (!this.coeffs) this.fit();

    // Use Horner's method for polynomial evaluation (more efficient)
    let result = this.coeffs?.[this.coeffs?.length - 1] ?? 0;
    for (let i = (this.coeffs?.length || 0) - 2; i >= 0; i--) {
      result = result * x + (this.coeffs?.[i] ?? 0);
    }
    return result;
  }
}

/** Fit y = a·e^(b·x) */
class ExponentialFitter extends BaseFitter {
  private lin = new LinearFitter();

  protected addPoint(x: number, y: number) {
    if (y > 0) {
      const ly = Math.log(y);
      this.lin.add(x, ly);
    }
  }

  public computeStatistics(): void {
    super.computeStatistics();
    this.lin.computeStatistics();
  }

  protected calculateValue(x: number): number {
    return Math.exp(this.lin.f(x));
  }
}

/** Statistical fitter that returns a constant y value (average) */
class AverageFitter extends BaseFitter {
  private sum = 0;
  private count = 0;

  protected addPoint(x: number, y: number) {
    this.sum += y;
    this.count++;
  }

  public computeStatistics(): void {
    super.computeStatistics();
    this.averageY = this.count > 0 ? this.sum / this.count : 0;
  }

  protected calculateValue(x: number): number {
    return this.averageY;
  }
}

/** Statistical fitter that returns the maximum y value */
class MaxFitter extends BaseFitter {
  protected addPoint(x: number, y: number) {
    this.maxY = Math.max(this.maxY, y);
  }

  protected calculateValue(x: number): number {
    return this.maxY;
  }
}

/** Statistical fitter that returns the minimum y value */
class MinFitter extends BaseFitter {
  protected addPoint(x: number, y: number) {
    this.minY = Math.min(this.minY, y);
  }

  protected calculateValue(x: number): number {
    return this.minY;
  }
}

/** Statistical fitter that returns the median y value */
class MedianFitter extends BaseFitter {
  private values: number[] = [];
  private sortedValues: number[] | null = null;

  protected addPoint(x: number, y: number) {
    this.values.push(y);
    this.sortedValues = null;
  }

  public computeStatistics(): void {
    super.computeStatistics();
    if (this.values.length === 0) {
      this.medianY = 0;
      return;
    }

    // Sort values for median calculation (only once)
    this.sortedValues = [...this.values].sort((a, b) => a - b);
    const mid = Math.floor(this.sortedValues.length / 2);

    // Calculate median
    if (this.sortedValues.length % 2 === 0) {
      this.medianY = (this.sortedValues[mid - 1] + this.sortedValues[mid]) / 2;
    } else {
      this.medianY = this.sortedValues[mid];
    }
  }

  protected calculateValue(x: number): number {
    return this.medianY;
  }
}

// Cache for processed padding to avoid recalculating for each label
const paddingCache = new Map<
  string,
  { top: number; right: number; bottom: number; left: number }
>();

// Process padding options with caching
const processPadding = (
  labelPadding:
    | number
    | { top?: number; bottom?: number; left?: number; right?: number }
    | undefined
): { top: number; right: number; bottom: number; left: number } => {
  // Create a cache key based on the input
  const cacheKey =
    labelPadding === undefined
      ? 'undefined'
      : typeof labelPadding === 'number'
        ? `num:${labelPadding}`
        : `obj:${labelPadding.top ?? ''}:${labelPadding.right ?? ''}:${labelPadding.bottom ?? ''}:${labelPadding.left ?? ''}`;

  // Check if we have a cached result
  const cached = paddingCache.get(cacheKey);
  if (cached) return cached;

  const defaultPadding = defaultLabelOptionConfig.padding;
  let result: { top: number; right: number; bottom: number; left: number };

  if (typeof labelPadding === 'number') {
    result = { top: labelPadding, right: labelPadding, bottom: labelPadding, left: labelPadding };
  } else if (labelPadding) {
    result = {
      top: labelPadding.top ?? defaultPadding.top,
      right: labelPadding.right ?? defaultPadding.right,
      bottom: labelPadding.bottom ?? defaultPadding.bottom,
      left: labelPadding.left ?? defaultPadding.left
    };
  } else {
    result = {
      top: defaultPadding.top,
      right: defaultPadding.right,
      bottom: defaultPadding.bottom,
      left: defaultPadding.left
    };
  }

  // Store in cache
  paddingCache.set(cacheKey, result);
  return result;
};

// Create appropriate fitter based on options
const createFitter = (opts: TrendlineOptions): BaseFitter => {
  switch (opts.type) {
    case 'polynomial_regression':
      return new PolynomialFitter(opts.polynomialOrder ?? DEFAULT_TRENDLINE_CONFIG.polynomialOrder);
    case 'logarithmic_regression':
      return new LogarithmicFitter();
    case 'exponential_regression':
      return new ExponentialFitter();
    case 'average':
      return new AverageFitter();
    case 'max':
      return new MaxFitter();
    case 'min':
      return new MinFitter();
    case 'median':
      return new MedianFitter();
    default:
      return new LinearFitter();
  }
};

// Set line style based on options - cache the settings to avoid unnecessary changes
const lineStyleCache = {
  currentStyle: '',
  currentWidth: 0
};

const setLineStyle = (ctx: CanvasRenderingContext2D, lineStyle?: string, lineWidth = 2) => {
  const styleKey = `${lineStyle ?? 'solid'}-${lineWidth}`;

  // Always set the line width regardless of cache state
  ctx.lineWidth = lineWidth;

  // Only skip updating the dash pattern if already set to this style
  if (lineStyleCache.currentStyle === styleKey) {
    return;
  }

  switch (lineStyle) {
    case 'dotted':
      ctx.setLineDash([lineWidth, lineWidth * 2]);
      break;
    case 'dashed':
      ctx.setLineDash([lineWidth * 4, lineWidth * 2]);
      break;
    case 'dashdot':
      ctx.setLineDash([lineWidth * 4, lineWidth * 2, 1, lineWidth * 2]);
      break;
    default:
      ctx.setLineDash([]);
  }

  lineStyleCache.currentStyle = styleKey;
  lineStyleCache.currentWidth = lineWidth;
};

// Draw a label with background
const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: TrendlineLabelOptions
) => {
  // Apply defaults from defaultLabelOptionConfig
  const fontSize = options.font?.size ?? defaultLabelOptionConfig.font.size;
  const fontFamily = options.font?.family ?? 'sans-serif';
  const fontWeight = options.font?.weight ?? defaultLabelOptionConfig.font.weight;
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const color = options.color ?? defaultLabelOptionConfig.color;
  const backgroundColor = options.backgroundColor ?? defaultLabelOptionConfig.backgroundColor;
  const borderColor = options.borderColor ?? defaultLabelOptionConfig.borderColor;
  const borderWidth = options.borderWidth ?? defaultLabelOptionConfig.borderWidth + 0.2;

  // Apply a scaling factor to make the border radius less intense
  const borderRadiusScale = 0.55; // Reduce to 40% of original value
  const baseBorderRadius = options.borderRadius ?? defaultLabelOptionConfig.borderRadius;
  const borderRadius = Math.max(2, Math.floor(baseBorderRadius * borderRadiusScale)); // Ensure minimum of 2px

  const padding = processPadding(options.padding);

  // Text measurement
  ctx.font = font;
  const textMetrics = ctx.measureText(text);
  const textHeight = fontSize;

  // Background calculation
  const rectWidth = textMetrics.width + padding.left + padding.right;
  const rectHeight = textHeight + padding.top + padding.bottom;

  // Center the rectangle around the target point
  const rectX = x - rectWidth / 2;
  const rectY = y - rectHeight / 2;

  // Draw background rect
  ctx.save();
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.fillStyle = backgroundColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    ctx.beginPath();
    ctx.moveTo(rectX + borderRadius, rectY);
    ctx.lineTo(rectX + rectWidth - borderRadius, rectY);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
    ctx.quadraticCurveTo(
      rectX + rectWidth,
      rectY + rectHeight,
      rectX + rectWidth - borderRadius,
      rectY + rectHeight
    );
    ctx.lineTo(rectX + borderRadius, rectY + rectHeight);
    ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius);
    ctx.lineTo(rectX, rectY + borderRadius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY);
    ctx.closePath();

    ctx.fill();
    if (borderWidth > 0 && borderColor && borderColor !== 'transparent') {
      ctx.setLineDash([]);
      ctx.stroke();
    }
  }

  // Draw text
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const textX = rectX + padding.left;
  const textY = rectY + padding.top;

  ctx.fillText(text, textX, textY);
  ctx.restore();
};

// Improved curved or straight line path drawing with fewer calculations
const drawLinePath = (
  ctx: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  fitter: BaseFitter,
  minX: number,
  maxX: number,
  lineType: TrendlineType
) => {
  const x1 = xScale.getPixelForValue(minX);
  const y1 = yScale.getPixelForValue(fitter.f(minX));

  if (
    lineType === 'linear_regression' ||
    lineType === 'average' ||
    lineType === 'max' ||
    lineType === 'min' ||
    lineType === 'median'
  ) {
    // Simple straight line for linear and statistical trendlines
    const x2 = xScale.getPixelForValue(maxX);
    const y2 = yScale.getPixelForValue(fitter.f(maxX));

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  } else {
    // For non-linear trendlines, use multiple points for a smooth curve
    // Adaptive segmentation - use more points where curve changes more rapidly
    const segments = lineType === 'polynomial_regression' ? 100 : 80;
    const xStep = (maxX - minX) / segments;

    ctx.moveTo(x1, y1);

    // Batch the y-value calculations for better performance
    const points = [];
    for (let i = 1; i <= segments; i++) {
      const currX = minX + i * xStep;
      points.push({
        x: currX,
        y: fitter.f(currX)
      });
    }

    // Draw the path
    for (const point of points) {
      const xPos = xScale.getPixelForValue(point.x);
      const yPos = yScale.getPixelForValue(point.y);

      // Skip any NaN or infinite values that might occur
      if (!Number.isNaN(yPos) && Number.isFinite(yPos)) {
        ctx.lineTo(xPos, yPos);
      }
    }
  }
};

// Fill area under the trendline
const fillUnderLine = (
  ctx: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  fitter: BaseFitter,
  minX: number,
  maxX: number,
  lineType: TrendlineType,
  fillStyle: string,
  chartBottom: number
) => {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();

  drawLinePath(ctx, xScale, yScale, fitter, minX, maxX, lineType);

  // Complete the polygon for filling
  const x2 = xScale.getPixelForValue(maxX);
  const x1 = xScale.getPixelForValue(minX);

  ctx.lineTo(x2, chartBottom);
  ctx.lineTo(x1, chartBottom);
  ctx.closePath();
  ctx.fill();
};

// Process data points from a dataset
const addDataPointsToFitter = (
  dataset: ChartDataset<'line', (number | Point | null)[]>,
  labels: undefined | string[] | Date[],
  fitter: BaseFitter,
  yAxisID?: string
) => {
  dataset.data.forEach((point, i: number) => {
    if (!point) return;
    if (typeof point === 'number') {
      let x: number | Date | undefined | string = i;
      const y = point;

      if (typeof labels?.[i] === 'object' && labels?.[i] instanceof Date) {
        x = labels?.[i]?.getTime();
      }

      if (typeof x === 'number' && typeof y === 'number') {
        fitter.add(x, y);
      }
    } else if (point) {
      const x = point.x ?? i;
      const y = point[(yAxisID ?? dataset.yAxisID ?? 'y') as 'y'] ?? point;
      if (typeof x === 'number' && typeof y === 'number') {
        fitter.add(x, y);
      }
    }
  });

  // Pre-compute statistics after all points are added
  fitter.computeStatistics();
};

const projectionDefaultType: TrendlineType[] = [
  'average',
  'max',
  'min',
  'median',
  'linear_regression',
  'polynomial_regression'
];

// Calculate trendline coordinates once to avoid duplication
const calculateTrendlineCoordinates = (
  xScale: Scale,
  yScale: Scale,
  fitter: BaseFitter,
  opts: TrendlineOptions
): TrendlineCoordinates => {
  const shouldUseProjection = opts.projection !== false;
  let minX = shouldUseProjection ? (xScale.min as number) : fitter.minx;
  const maxX = shouldUseProjection ? (xScale.max as number) : fitter.maxx;

  // For logarithmic trendlines, ensure minX is positive
  if (opts.type === 'logarithmic_regression' && minX <= 0) {
    // Use the smallest positive x value or 0.1 as a fallback
    minX = Math.max(0.1, fitter.minx);
  }

  const x1 = xScale.getPixelForValue(minX);
  const y1 = yScale.getPixelForValue(fitter.f(minX));
  const x2 = xScale.getPixelForValue(maxX);
  const y2 = yScale.getPixelForValue(fitter.f(maxX));

  // compute slope (delta y / delta x)
  const slope = (fitter.f(maxX) - fitter.f(minX)) / (maxX - minX);

  return {
    minX,
    maxX,
    x1,
    y1,
    x2,
    y2,
    slope
  };
};

// Optimized spatial index for faster collision detection
class SpatialIndex {
  private cells: Map<string, Array<{ x: number; y: number; width: number; height: number }>> =
    new Map();
  private cellSize = 50; // Size of each grid cell

  clear(): void {
    this.cells.clear();
  }

  // Get cell key for a point
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  // Get all cell keys that a rectangle overlaps with
  private getOverlappingCellKeys(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): string[] {
    const minCellX = Math.floor(rect.x / this.cellSize);
    const minCellY = Math.floor(rect.y / this.cellSize);
    const maxCellX = Math.floor((rect.x + rect.width) / this.cellSize);
    const maxCellY = Math.floor((rect.y + rect.height) / this.cellSize);

    const keys: string[] = [];
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  // Add a rectangle to the index
  add(rect: { x: number; y: number; width: number; height: number }): void {
    const cellKeys = this.getOverlappingCellKeys(rect);
    for (const key of cellKeys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, []);
      }
      this.cells.get(key)?.push(rect);
    }
  }

  // Check if a rectangle overlaps with any existing rectangles
  checkCollision(rect: { x: number; y: number; width: number; height: number }): boolean {
    const cellKeys = this.getOverlappingCellKeys(rect);
    for (const key of cellKeys) {
      const cellRects = this.cells.get(key);
      if (cellRects) {
        for (const existingRect of cellRects) {
          if (doRectsOverlap(rect, existingRect)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

// Helper function to check if two rectangles overlap
const doRectsOverlap = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Helper function to queue a label for later drawing
const queueTrendlineLabel = (
  ctx: CanvasRenderingContext2D,
  fitter: BaseFitter,
  opts: TrendlineOptions,
  spatialIndex: SpatialIndex,
  labelDrawingQueue: Array<{
    ctx: CanvasRenderingContext2D;
    text: string;
    x: number;
    y: number;
    opts: TrendlineLabelOptions;
  }>,
  coords: TrendlineCoordinates,
  labelIndices?: { datasetIndex: number; trendlineIndex: number },
  xScale?: Scale,
  yScale?: Scale
) => {
  if (!opts.label?.display) return;

  const lbl = opts.label;

  // Use pre-calculated values from coords
  const { minX, maxX, x1, y1, x2, y2, slope } = coords;

  // Format the label text
  const val = lbl.percentage ? `${(slope * 100).toFixed(2)}%` : slope.toFixed(2);

  // Handle text as either string or callback function
  let textContent: string;
  if (typeof lbl.text === 'function') {
    // Call the function with the slope value
    textContent = lbl.text({
      slope,
      minX,
      maxX,
      averageY: fitter.averageY,
      medianY: fitter.medianY,
      minY: fitter.minY,
      maxY: fitter.maxY
    });
  } else {
    // Use the string value or empty string if undefined
    textContent = lbl.text || '';
  }

  // Final label text
  const labelText = `${textContent}`.trim();

  // Position along the trendline segment based on positionRatio
  const t = (lbl.positionRatio ?? DEFAULT_TRENDLINE_CONFIG.trendlineLabelPositionOffset) / 100; // Default to 85% along the line

  let targetX: number;
  let targetY: number;

  // If we have scales, use them to calculate exact curve position
  if (xScale && yScale) {
    // Calculate the X position along the line based on the ratio
    const interpolatedX = minX + t * (maxX - minX);

    // Constrain the interpolatedX to be within the actual data range regardless of projection
    // This ensures the label never goes beyond the last data point
    const constrainedX = Math.max(fitter.minx, Math.min(fitter.maxx, interpolatedX));

    // Get the actual Y value ON the curve using the fitter for this X position
    const interpolatedY = fitter.f(constrainedX);

    // Convert to pixel coordinates
    targetX = xScale.getPixelForValue(constrainedX);
    targetY = yScale.getPixelForValue(interpolatedY);
  } else {
    // Fallback to linear interpolation if scales aren't provided
    targetX = x1 + t * (x2 - x1);
    targetY = y1 + t * (y2 - y1);
  }

  // Apply user-defined offset (perpendicular to the line)
  const offsetValue = lbl.offset ?? 0;

  // Apply offset
  const offsetX = 0;
  let offsetY = offsetValue;

  // Apply additional offsets based on dataset and trendline indices if provided
  if (labelIndices && offsetValue !== 0) {
    // Use dataset index and trendline index to create a staggered effect
    const additionalOffset =
      offsetValue * 0.5 * (labelIndices.datasetIndex + labelIndices.trendlineIndex);
    offsetY += additionalOffset;
  }

  const finalX = targetX + offsetX;
  const finalY = targetY + offsetY;

  // Measure text to calculate label size
  ctx.font = `${lbl.font?.weight ?? defaultLabelOptionConfig.font.weight} ${lbl.font?.size ?? defaultLabelOptionConfig.font.size}px ${lbl.font?.family ?? 'sans-serif'}`;
  const textMetrics = ctx.measureText(labelText);
  const padding = processPadding(lbl.padding);
  const labelWidth = textMetrics.width + padding.left + padding.right;
  const labelHeight =
    (lbl.font?.size ?? defaultLabelOptionConfig.font.size) + padding.top + padding.bottom;

  // Check for collisions with existing labels
  const labelRect = {
    x: finalX - labelWidth / 2,
    y: finalY - labelHeight / 2,
    width: labelWidth,
    height: labelHeight
  };

  // Use spatial index for faster collision detection
  if (spatialIndex.checkCollision(labelRect)) {
    // Label would overlap, so skip adding it
    return;
  }

  // Add label rect to spatial index
  spatialIndex.add(labelRect);

  // Queue the label for drawing later (to ensure it's on top of all lines)
  labelDrawingQueue.push({
    ctx,
    text: labelText,
    x: finalX,
    y: finalY,
    opts: lbl
  });
};

// Helper function to draw just the trendline path (without labels)
const drawTrendlinePath = (
  ctx: CanvasRenderingContext2D,
  chartArea: { bottom: number; top: number; left: number; right: number },
  xScale: Scale,
  yScale: Scale,
  fitter: BaseFitter,
  opts: TrendlineOptions,
  defaultColor: string,
  coords?: TrendlineCoordinates
) => {
  // Use pre-calculated coordinates if available, otherwise calculate them
  const { minX, maxX, x1, y1, x2, y2 } =
    coords || calculateTrendlineCoordinates(xScale, yScale, fitter, opts);
  const yBottom = chartArea.bottom;

  // Skip drawing if we have invalid coordinates
  if (Number.isNaN(y1) || Number.isNaN(y2)) {
    console.warn('Skipping trendline drawing due to invalid values');
    return;
  }

  // === DRAWING LOGIC ===
  ctx.save();

  // Apply clipping to restrict drawing within chart area
  ctx.beginPath();
  ctx.rect(
    chartArea.left,
    chartArea.top,
    chartArea.right - chartArea.left,
    chartArea.bottom - chartArea.top
  );
  ctx.clip();

  // 1) stroke style: gradient or solid
  const cMin = opts.colorMin ?? defaultColor;
  const cMax = opts.colorMax ?? cMin;

  const stroke = ctx.createLinearGradient(x1, y1, x2, y2);
  stroke.addColorStop(0, cMin);
  stroke.addColorStop(1, cMax);
  ctx.strokeStyle = stroke;

  // 2) line width + dash
  setLineStyle(ctx, opts.lineStyle, opts.width);

  // 3) stroke the trendline
  ctx.beginPath();
  drawLinePath(ctx, xScale, yScale, fitter, minX, maxX, opts.type);
  ctx.stroke();

  // 4) optional fill under the line
  if (opts.fillColor) {
    const fillColor = opts.fillColor === true ? cMin : opts.fillColor;
    fillUnderLine(ctx, xScale, yScale, fitter, minX, maxX, opts.type, fillColor, yBottom);
  }

  // cleanup
  ctx.restore();
};

const trendlinePlugin: Plugin<'line'> = {
  id: 'chartjs-plugin-trendline-ts',

  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const pluginOptions = chart.options.plugins?.trendline as TrendlinePluginOptions | undefined;
    const { chartArea } = chart;
    const labels = chart.data.labels as string[] | Date[] | undefined;

    // get horizontal (x) and vertical (y) scales
    const xScale = Object.values(chart.scales).find((s) => s.isHorizontal());
    const yScale = Object.values(chart.scales).find((s) => !s.isHorizontal());

    if (!xScale || !yScale) {
      console.warn('Trendline plugin requires both x and y scales');
      return;
    }

    // Use spatial index for faster collision detection
    const labelSpatialIndex = new SpatialIndex();

    // Store all label drawing operations for later execution (to ensure higher z-index)
    const labelDrawingQueue: Array<{
      ctx: CanvasRenderingContext2D;
      text: string;
      x: number;
      y: number;
      opts: TrendlineLabelOptions;
    }> = [];

    // Reset line style cache
    lineStyleCache.currentStyle = '';
    lineStyleCache.currentWidth = 0;

    // Check if we should create an aggregated trendline
    if (pluginOptions?.aggregateMultiple && pluginOptions.aggregateMultiple.length > 0) {
      // Process each aggregate trendline configuration
      for (const aggregateConfig of pluginOptions.aggregateMultiple) {
        const yAxisAggregateKey = aggregateConfig.yAxisKey;
        const yAxisID = aggregateConfig.yAxisID;

        // Find datasets that match the yAxisKey for this aggregation
        const datasetsWithTrendline = chart.data.datasets.filter(
          (ds) => ds.data.length >= 1 && ds.yAxisKey === yAxisAggregateKey
        );

        if (datasetsWithTrendline.length > 0) {
          // Get the first trendline options to use as default for aggregated trendline
          const firstDatasetWithTrendline = datasetsWithTrendline[0];

          // Create fitter based on the aggregate config
          const fitter = createFitter(aggregateConfig);

          // Collect all data points from all datasets that match this yAxisKey
          for (const dataset of datasetsWithTrendline) {
            addDataPointsToFitter(dataset, labels, fitter, yAxisID);
          }

          // Draw the aggregated trendline if we have valid data points
          if (
            fitter.minx !== Number.POSITIVE_INFINITY &&
            fitter.maxx !== Number.NEGATIVE_INFINITY
          ) {
            const defaultColor =
              (firstDatasetWithTrendline.borderColor as string) ?? 'rgba(0,0,0,0.3)';

            // Calculate coordinates once
            const coords = calculateTrendlineCoordinates(xScale, yScale, fitter, aggregateConfig);

            drawTrendlinePath(
              ctx,
              chartArea,
              xScale,
              yScale,
              fitter,
              aggregateConfig,
              defaultColor,
              coords
            );

            // Queue label for later drawing if needed
            if (aggregateConfig.label?.display) {
              queueTrendlineLabel(
                ctx,
                fitter,
                aggregateConfig,
                labelSpatialIndex,
                labelDrawingQueue,
                coords,
                undefined, // No label indices for aggregate
                xScale,
                yScale
              );
            }
          }
        }
      }
    }

    // Original behavior - draw individual trendlines for each dataset
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const trendlineOptions = dataset.trendline;
      if (
        !trendlineOptions ||
        dataset.data.length < 1 ||
        dataset.hidden ||
        !chart.isDatasetVisible(datasetIndex)
      ) {
        return;
      }

      // Convert to array if it's a single object for backward compatibility
      const trendlineArray = Array.isArray(trendlineOptions)
        ? trendlineOptions
        : [trendlineOptions];

      // Process each trendline option
      trendlineArray.forEach((opts, trendlineIndex) => {
        if (!opts || !opts.type || !opts.show) return;

        // Create the appropriate fitter
        const fitter = createFitter(opts);

        // Add all data points to the fitter
        addDataPointsToFitter(dataset, labels, fitter);

        // Skip if no valid points were added
        if (fitter.minx === Number.POSITIVE_INFINITY || fitter.maxx === Number.NEGATIVE_INFINITY) {
          return;
        }

        // For exponential trendlines, ensure we have valid y values
        if (opts.type === 'exponential_regression') {
          // Check if we have valid data (positive y values)
          const hasValidPoints = dataset.data.some((point) => {
            if (!point) return false;
            if (typeof point === 'number') return point > 0;
            const y = point[(dataset.yAxisID ?? 'y') as 'y'] ?? point;
            return typeof y === 'number' && y > 0;
          });

          if (!hasValidPoints) {
            console.warn('Exponential trendline requires positive y values');
            return;
          }
        }

        const defaultColor = (dataset.borderColor as string) ?? 'rgba(0,0,0,0.3)';

        // Calculate coordinates once
        const coords = calculateTrendlineCoordinates(xScale, yScale, fitter, opts);

        // Draw only the trendline first (not labels)
        drawTrendlinePath(ctx, chartArea, xScale, yScale, fitter, opts, defaultColor, coords);

        // Queue label for later drawing if needed
        if (opts.label?.display) {
          const labelIndices = { datasetIndex, trendlineIndex };
          queueTrendlineLabel(
            ctx,
            fitter,
            opts,
            labelSpatialIndex,
            labelDrawingQueue,
            coords,
            labelIndices,
            xScale,
            yScale
          );
        }
      });
    });

    // After all trendlines are drawn, draw all labels on top - do this in a batch
    if (labelDrawingQueue.length > 0) {
      ctx.save();
      for (const item of labelDrawingQueue) {
        drawLabel(item.ctx, item.text, item.x, item.y, item.opts);
      }
      ctx.restore();
    }
  }
};

export default trendlinePlugin;

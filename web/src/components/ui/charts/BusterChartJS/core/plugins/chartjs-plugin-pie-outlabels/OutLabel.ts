import type { ArcElement, Point } from 'chart.js';
import { toFontString } from 'chart.js/helpers';
import type OutLabelsContext from './OutLabelsContext';
import type { OutLabelStyle } from './OutLabelsStyle';
import type Rect from './Rect';
import type Size from './Size';
import { drawRoundedRect, textSize } from './helpers';

export default class OutLabel {
  ctx: CanvasRenderingContext2D;
  index: number;
  context: OutLabelsContext;
  arc!: ArcElement;

  text: string;
  lines: RegExpMatchArray;
  label: string;
  value: number;

  style: OutLabelStyle;

  size: Size;

  x1!: number;
  y1!: number;
  x!: number;
  y!: number;
  rect: Rect = { height: 0, width: 0, x: 0, y: 0 };
  nx!: number;

  get center(): Point {
    return {
      x: this.x,
      y: this.y
    };
  }

  constructor(
    ctx: CanvasRenderingContext2D,
    context: OutLabelsContext,
    index: number,
    style: OutLabelStyle
  ) {
    this.ctx = ctx;
    this.index = index;
    this.context = context;

    this.style = style;

    // Init text
    const label = context.labels[index];
    let text = this.style.text;

    if (context.formatter) {
      text = context.formatter(context.usePercent ? context.percent * 100 : context.value);
    } else {
      text = text.replace(/%l/gi, label);

      /* Replace value marker with possible precision value */
      // biome-ignore lint/complexity/noForEach: <explanation>
      (text.match(/%v\.?(\d*)/gi) || [])
        .map((val) => {
          const prec = val.replace(/%v\./gi, '');
          if (prec.length) {
            return +prec;
          }
          return this.style.valuePrecision;
        })
        .forEach((val) => {
          if (text) text = text.replace(/%v\.?(\d*)/i, context.value.toFixed(val));
        });

      /* Replace percent marker with possible precision value */
      // biome-ignore lint/complexity/noForEach: <explanation>
      (text.match(/%p\.?(\d*)/gi) || [])
        .map((val) => {
          const prec = val.replace(/%p\./gi, '');
          if (prec.length) {
            return +prec;
          }
          return this.style.percentPrecision;
        })
        .forEach((val) => {
          let percentPrecision = this.style.percentPrecision;
          if (!Number.isNaN(val)) {
            percentPrecision = val;
          }
          if (text)
            text = text.replace(
              /%p\.?(\d*)/i,
              `${(context.percent * 100).toFixed(percentPrecision)}%`
            );
        });
    }

    const lines = text.match(/[^\r\n]+/g);
    if (!lines || !lines.length) throw new Error('No text to show.');

    for (let i = 0; i < lines.length; ++i) {
      lines[i] = lines[i].trim();
    }

    this.text = text;
    this.lines = lines;
    this.label = label;
    this.value = context.value;
    this.size = textSize(ctx, this.lines, this.style.font);
  }

  computeRect(): Rect {
    return {
      x:
        this.x +
        (this.nx < 0 ? -this.size.width : 0) -
        this.style.padding.left -
        this.style.borderWidth,
      y: this.y - this.size.height / 2 - this.style.padding.top - this.style.borderWidth,
      width: this.size.width + 2 * this.style.borderWidth + this.style.padding.width,
      height: this.size.height + 2 * this.style.borderWidth + this.style.padding.height
    };
  }

  clearArea(): void {
    this.ctx.clearRect(
      this.rect.x - this.style.borderWidth,
      this.rect.y - this.style.borderWidth,
      this.rect.width + 2 * this.style.borderWidth,
      this.rect.height + 2 * this.style.borderWidth
    );
  }

  drawText(): void {
    if (!this.lines.length || !this.style.display) {
      return;
    }

    this.ctx.font = toFontString(this.style.font);
    this.ctx.fillStyle = this.style.color;
    this.ctx.textAlign = this.nx < 0 ? 'right' : 'left';
    this.ctx.textBaseline = 'middle';

    const x = this.x;
    let y = this.y;
    for (let idx = 0; idx < this.lines.length; ++idx) {
      this.ctx.fillText(this.lines[idx], Math.round(x), Math.round(y), Math.round(this.size.width));

      y += this.style.font.lineSize;
    }
  }

  drawRect(): void {
    if (!this.style.display) {
      return;
    }

    this.ctx.beginPath();

    drawRoundedRect(
      this.ctx,
      this.rect.x,
      this.rect.y,
      this.rect.width,
      this.rect.height,
      this.style.borderRadius
    );
    this.ctx.closePath();

    if (this.style.backgroundColor) {
      this.ctx.fillStyle = this.style.backgroundColor;
      this.ctx.fill();
    }

    if (this.style.borderColor && this.style.borderWidth) {
      this.ctx.strokeStyle = this.style.borderColor;
      this.ctx.lineWidth = this.style.borderWidth;
      this.ctx.lineJoin = 'miter';
      this.ctx.stroke();
    }
  }

  drawLine(): void {
    if (!this.style.display) {
      return;
    }

    this.ctx.save();

    this.ctx.strokeStyle = this.style.lineColor || 'black';
    this.ctx.lineWidth = this.style.lineWidth;
    this.ctx.lineJoin = 'miter';
    this.ctx.beginPath();

    this.ctx.moveTo(this.x1, this.y1);
    this.ctx.lineTo(this.x, this.y);
    this.ctx.stroke();

    this.ctx.restore();
  }

  draw(): void {
    this.clearArea(); // Clear the area before drawing

    if (!this.style.display) {
      return;
    }
    this.drawRect();
    this.drawText();
  }

  updateRects(): void {
    this.rect = this.computeRect();
  }

  positionCenter(arc: ArcElement): void {
    this.arc = arc;
    const chart = this.context.chart;

    const midAngle = (arc.startAngle + arc.endAngle) / 2;
    const nx = Math.cos(midAngle);
    const ny = Math.sin(midAngle);
    //const d = arc.outerRadius
    /*
        const viewWidth = chart.chartArea.width
        const viewLeft = chart.chartArea.x
        const viewTop = chart.chartArea.y
        const viewHeight = chart.chartArea.height */

    const cx = (chart.chartArea.left + chart.chartArea.right) / 2;
    const cy = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    const r = arc.outerRadius;

    const x1 = r * nx + cx;
    const y1 = r * ny + cy;

    const x2 = x1 + nx * this.style.length;
    const y2 = y1 + ny * this.style.length;

    this.x1 = x1;
    this.y1 = y1;
    this.x = x2;
    this.y = y2;
    this.nx = nx;
  }
}

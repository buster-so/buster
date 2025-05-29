import { toFontString } from 'chart.js/helpers';
import type { FontStyle } from './OutLabelsStyle';
import type Size from './Size';

export function textSize(
  ctx: CanvasRenderingContext2D,
  lines: RegExpMatchArray,
  font: FontStyle
): Size {
  const prev = ctx.font;
  let width = 0;

  ctx.font = toFontString(font);

  for (let i = 0; i < lines.length; ++i) {
    width = Math.max(ctx.measureText(lines[i]).width, width);
  }

  ctx.font = prev;
  return {
    height: lines.length * font.lineSize,
    width: width
  };
}

export function adaptTextSizeToHeight(height: number, min?: number, max?: number): number {
  const size = (height / 100) * 2.5;
  if (min && size < min) {
    return min;
  }
  if (max && size > max) {
    return max;
  }
  return size;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
): void {
  const HALF_PI = Math.PI / 2;

  if (radius) {
    const r = Math.min(radius, h / 2, w / 2);
    const left = x + r;
    const top = y + r;
    const right = x + w - r;
    const bottom = y + h - r;

    ctx.moveTo(x, top);
    if (left < right && top < bottom) {
      ctx.arc(left, top, r, -Math.PI, -HALF_PI);
      ctx.arc(right, top, r, -HALF_PI, 0);
      ctx.arc(right, bottom, r, 0, HALF_PI);
      ctx.arc(left, bottom, r, HALF_PI, Math.PI);
    } else if (left < right) {
      ctx.moveTo(left, y);
      ctx.arc(right, top, r, -HALF_PI, HALF_PI);
      ctx.arc(left, top, r, HALF_PI, Math.PI + HALF_PI);
    } else if (top < bottom) {
      ctx.arc(left, top, r, -Math.PI, 0);
      ctx.arc(left, bottom, r, 0, Math.PI);
    } else {
      ctx.arc(left, top, r, -Math.PI, Math.PI);
    }
    ctx.closePath();
    ctx.moveTo(x, y);
  } else {
    ctx.rect(x, y, w, h);
  }
}

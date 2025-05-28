import memoize from 'lodash/memoize';
import { isServer } from '@tanstack/react-query';

let ctx: CanvasRenderingContext2D;
const getCanvasContext = () => {
  if (!ctx) {
    //@ts-ignore
    ctx = document.createElement('canvas').getContext('2d');
  }

  return ctx;
};

interface FontOptions {
  fontSize?: string | number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  fontVariant?: string;
}

export const measureTextWidth = memoize(
  (text: string | number, font: FontOptions = {}) => {
    if (!isServer) {
      const { fontSize, fontFamily = 'Roobert_Pro', fontWeight, fontStyle, fontVariant } = font;
      const ctx = getCanvasContext();
      // @see https://developer.mozilla.org/zh-CN/docs/Web/CSS/font
      ctx.font = [fontStyle, fontWeight, fontVariant, `${fontSize || 13.6}px`, fontFamily].join(
        ' '
      );
      const metrics = ctx.measureText(
        typeof text === 'string' || typeof text === 'number' ? String(text) : ''
      );

      return {
        width: metrics.width,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      };
    }
    return {
      width: 0,
      height: 0
    };
  },
  (text: string | number, font = {}) => [text, ...Object.values(font)].join('')
);

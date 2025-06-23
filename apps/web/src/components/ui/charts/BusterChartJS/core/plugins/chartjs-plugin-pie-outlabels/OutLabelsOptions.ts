import type {
  FontSpec,
  Scriptable,
  ScriptableAndScriptableOptions,
  ScriptableChartContext
} from 'chart.js';
import type OutLabelsContext from './OutLabelsContext';

export type TRBL = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type FontOptions = FontSpec & {
  resizable?: boolean;
  minSize?: number;
  maxSize?: number;
};

export type OutLabelsOptions = {
  display?: Scriptable<boolean, OutLabelsContext>;
  text?: Scriptable<string, OutLabelsContext>;
  textAlign?: string;
  color?: string;
  borderRadius?: number;
  borderWidth?: number;
  lineWidth?: number;
  length?: number;
  percentPrecision?: number;
  valuePrecision?: number;
  animateInDuration?: number;
  padding?: number | TRBL;
  font?: ScriptableAndScriptableOptions<Partial<FontOptions>, ScriptableChartContext>;
  backgroundColor?: Scriptable<string, OutLabelsContext>;
  borderColor?: Scriptable<string, OutLabelsContext>;
  lineColor?: Scriptable<string, OutLabelsContext>;
  shrinkPercentage?: number;
  formatter?: (value: number) => string;
  usePercent?: boolean;
};

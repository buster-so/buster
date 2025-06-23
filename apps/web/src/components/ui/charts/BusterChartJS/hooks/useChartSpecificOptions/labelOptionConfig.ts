'use client';

import { isServer } from '@tanstack/react-query';
import type { ChartProps } from '../../core';

const backgroundColor = isServer
  ? '#e6e6e6'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-page-background');

const borderColor = isServer
  ? '#e0e0e0'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-border');

const textColor = isServer
  ? '#575859'
  : getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary');

export const defaultLabelOptionConfig = {
  backgroundColor: backgroundColor,
  borderWidth: 0.5,
  borderColor: borderColor,
  borderRadius: 6,
  padding: {
    top: 3,
    bottom: 3,
    left: 6,
    right: 6
  },
  color: textColor,
  font: {
    size: 10,
    weight: 'normal' as const
  }
} satisfies ChartProps<'line'>['data']['datasets'][number]['datalabels'];

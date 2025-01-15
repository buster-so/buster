import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import { ColorAppSegments, COLORFUL_THEMES, MONOCHROME_THEMES } from './config';
import type { IBusterThreadMessageChartConfig } from '@/api/buster-rest/threads';
import { Segmented } from 'antd';

const options = [
  {
    label: (
      <div className="flex items-center space-x-1">
        <div
          className="h-3 w-3 rounded-full"
          style={{
            background: 'linear-gradient(-45deg, #F87B8D, #AA8EFE, #F7B528)'
          }}></div>
        <span>Colorful</span>
      </div>
    ),
    value: ColorAppSegments.Colorful
  },
  {
    label: (
      <div className="flex items-center space-x-1">
        <div
          className="h-3 w-3 rounded-full"
          style={{ background: 'linear-gradient(-45deg, #2958E9, #5B9AFA)' }}></div>
        <span>Monochrome</span>
      </div>
    ),
    value: ColorAppSegments.Monochrome
  }
];

export const ColorStyleSegments: React.FC<{
  colors: IBusterThreadMessageChartConfig['colors'];
  setSelectedSegment: (value: ColorAppSegments) => void;
  initialSelectedSegment: ColorAppSegments;
}> = React.memo(
  ({ initialSelectedSegment, setSelectedSegment }) => {
    return (
      <Segmented
        block
        options={options}
        defaultValue={initialSelectedSegment}
        onChange={setSelectedSegment}
      />
    );
  },
  () => {
    return true;
  }
);
ColorStyleSegments.displayName = 'PaletteSegments';

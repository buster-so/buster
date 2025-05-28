import React from 'react';

import type { iconProps } from './iconProps';

function cloudDownload2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px cloud download 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.518,2.51C7.77.985,6.228,0,4.5,0,2.019,0,0,2.019,0,4.5c0,1.31.572,2.48,1.468,3.303.108-.232.25-.453.441-.644.425-.425.99-.659,1.591-.659.084,0,.167.004.25.014v-.764c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v.764c.083-.009.166-.014.25-.014.601,0,1.166.234,1.591.659.331.331.536.739.618,1.167.78-.594,1.292-1.523,1.292-2.576,0-1.868-1.563-3.405-3.482-3.24Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.03,8.22c-.293-.293-.768-.293-1.061,0l-1.22,1.22v-3.689c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.689l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2.5,2.5c.146.146.338.22.53.22s.384-.073.53-.22l2.5-2.5c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default cloudDownload2;

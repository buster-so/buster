import React from 'react';

import type { iconProps } from './iconProps';

function arrowRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-3.309,0-6-2.691-6-6S2.691,0,6,0c2.31,0,4.375,1.289,5.392,3.364.182.372.028.821-.344,1.003-.374.182-.821.027-1.004-.344-.762-1.557-2.312-2.523-4.044-2.523C3.519,1.5,1.5,3.519,1.5,6s2.019,4.5,4.5,4.5c1.965,0,3.687-1.255,4.286-3.125.126-.393.547-.613.942-.485.395.126.612.549.485.943-.799,2.492-3.095,4.167-5.714,4.167Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,4.5h-3c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h2.25V.75c0-.414.336-.75.75-.75s.75.336.75.75v3c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowRotateClockwise;

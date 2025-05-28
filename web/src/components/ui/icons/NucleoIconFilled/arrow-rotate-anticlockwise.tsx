import React from 'react';

import type { iconProps } from './iconProps';

function arrowRotateAnticlockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow rotate anticlockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,12c-2.619,0-4.915-1.674-5.714-4.167-.127-.395.091-.817.485-.943.396-.129.816.091.942.485.6,1.869,2.321,3.125,4.286,3.125,2.481,0,4.5-2.019,4.5-4.5S8.481,1.5,6,1.5c-1.732,0-3.282.967-4.044,2.523-.183.372-.63.526-1.004.344-.372-.183-.525-.632-.344-1.003C1.625,1.289,3.69,0,6,0c3.309,0,6,2.691,6,6s-2.691,6-6,6Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.25,4.5H1.25c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v2.25h2.25c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowRotateAnticlockwise;

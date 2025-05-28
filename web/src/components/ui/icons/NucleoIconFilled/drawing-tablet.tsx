import React from 'react';

import type { iconProps } from './iconProps';

function drawingTablet(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px drawing tablet';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15,7.651v5.099c0,.689-.561,1.25-1.25,1.25H6.25c-.689,0-1.25-.561-1.25-1.25V5.25c0-.689,.561-1.25,1.25-1.25h7.75l2-2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.651l-2,2ZM3.25,9.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.101,.899c-.697-.697-1.833-.697-2.53,0l-5.25,5.25c-.8,.8-.856,2.785-.86,3.009-.001,.102,.038,.2,.11,.271,.07,.07,.166,.11,.265,.11h.006c.224-.004,2.208-.06,3.009-.86l5.25-5.25c.698-.698,.698-1.833,0-2.53Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default drawingTablet;

import React from 'react';

import type { iconProps } from './iconProps';

function alertQuestion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px alert question';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="6" cy="10.5" fill="currentColor" r="1" strokeWidth="0" />
        <path
          d="m3.929,3.277c.316-1.206,1.3-1.83,2.401-1.773,1.087.056,2.099.654,2.052,2.041-.066,1.972-2.277,1.612-2.382,3.955"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default alertQuestion;

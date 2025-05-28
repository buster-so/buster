import React from 'react';

import type { iconProps } from './iconProps';

function msgStar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg star';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.19,9.887c.036-.291,.06-.586,.06-.887,0-4.004-3.246-7.25-7.25-7.25S1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,.213,0,.423-.014,.632-.032"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 11.068L15.004 13.103 17.25 13.429 15.625 15.013 16.009 17.25 14 16.194 11.991 17.25 12.375 15.013 10.75 13.429 12.996 13.103 14 11.068z"
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

export default msgStar;

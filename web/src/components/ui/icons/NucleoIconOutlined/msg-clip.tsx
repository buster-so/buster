import React from 'react';

import type { iconProps } from './iconProps';

function msgClip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg clip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.216,9.676c.021-.223,.034-.448,.034-.676,0-4.004-3.246-7.25-7.25-7.25S1.75,4.996,1.75,9c0,1.319,.358,2.552,.973,3.617,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.433,.082,.881,.125,1.338,.125,.334,0,.66-.031,.982-.074"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,14.25v-2c0-.69-.56-1.25-1.25-1.25h0c-.69,0-1.25,.56-1.25,1.25v2.5c0,1.381,1.119,2.5,2.5,2.5h0c1.381,0,2.5-1.119,2.5-2.5v-2"
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

export default msgClip;

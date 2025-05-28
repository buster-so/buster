import React from 'react';

import type { iconProps } from './iconProps';

function paperPlane(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paper plane';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75,10.022v4.246c0,.409,.464,.645,.794,.404l.74-.539"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.58 2.569L5.75 10.022"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.883,6.935L15.182,2.542c.363-.13,.73,.183,.66,.562l-2.196,11.86c-.067,.363-.492,.531-.789,.311L2.754,7.807c-.322-.238-.248-.738,.129-.873Z"
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

export default paperPlane;

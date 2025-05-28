import React from 'react';

import type { iconProps } from './iconProps';

function msgForward(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg forward';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.25,9.25H2.878c-.616,0-1.109,.556-.989,1.16,.158,.789,.444,1.532,.834,2.207,.43,.806-.053,2.712-.973,3.633,1.25,.068,2.897-.497,3.633-.973,.489,.282,1.264,.656,2.279,.848,.832,.157,1.714,.171,2.623,.013,2.902-.504,5.27-2.806,5.827-5.699,.891-4.636-2.637-8.689-7.111-8.689C5.781,1.75,3.053,3.847,2.106,6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75 6.5L10.5 9.25 7.75 12"
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

export default msgForward;

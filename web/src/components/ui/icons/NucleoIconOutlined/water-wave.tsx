import React from 'react';

import type { iconProps } from './iconProps';

function waterWave(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px water wave';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,14.25c1.4,.004,2.729-.616,3.625-1.692,1.678,2.002,4.661,2.265,6.663,.587,.212-.178,.409-.374,.587-.587,.894,1.078,2.224,1.699,3.625,1.692"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,10.383h.659c3.954,0,3.103-4.224,5.612-6.32,2.755-2.3,5.247,.327,5.638,.818-2.738,.491-2.023,5.501,1.931,5.501h.659"
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

export default waterWave;

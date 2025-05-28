import React from 'react';

import type { iconProps } from './iconProps';

function slippers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px slippers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.746,5.065c-2.02-.655-4.233-.277-5.92,1.012"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75,8.99c1.229-1.225,3.08-1.58,4.675-.896"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.749,12.749c0,1.104-.894,2-1.999,2.001-.857,0-1.619-.546-1.895-1.357-.489-1.28-.381-2.074-.939-3.897-.51-1.667-1.166-2.674-1.166-4.316,0-1.7,1.721-3.266,3.533-3.418,1.439-.12,2.467,.684,2.467,3.076,0,1.627-.334,1.71-.334,3.8,0,2.012,.352,2.562,.334,4.112Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.254,6.565c2.02-.655,4.233-.277,5.92,1.012"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,10.49c-1.229-1.225-3.08-1.58-4.675-.896"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.251,14.249c0,1.104,.894,2,1.999,2.001,.857,0,1.619-.546,1.895-1.357,.489-1.28,.381-2.074,.939-3.897,.51-1.667,1.166-2.674,1.166-4.316,0-1.7-1.721-3.266-3.533-3.418-1.439-.12-2.467,.684-2.467,3.076,0,1.627,.334,1.71,.334,3.8,0,2.012-.352,2.562-.334,4.112Z"
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

export default slippers;

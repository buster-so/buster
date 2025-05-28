import React from 'react';

import type { iconProps } from './iconProps';

function awardPlaque(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px award plaque';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75,14.5c-.822,0-1.544-.402-2-1.014v4.014c0,.202,.122,.385,.309,.462,.187,.079,.401,.035,.545-.108l1.146-1.146,1.146,1.146c.096,.096,.224,.146,.354,.146,.064,0,.13-.012,.191-.038,.187-.077,.309-.26,.309-.462v-4.014c-.456,.612-1.178,1.014-2,1.014Z"
          fill="currentColor"
        />
        <path
          d="M10.287,14.25H3.75c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v1.98"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 7.25L11 7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 10.25L8.25 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14.75"
          cy="12"
          fill="none"
          r="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default awardPlaque;

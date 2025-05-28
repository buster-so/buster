import React from 'react';

import type { iconProps } from './iconProps';

function envelopeOpenHeart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope open heart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.781,7.447c.138,.071,.299,.071,.437,0,.729-.374,3.031-1.73,3.031-3.934,.004-.968-.791-1.757-1.777-1.763-.593,.007-1.144,.301-1.473,.786-.329-.484-.881-.778-1.473-.786-.985,.006-1.78,.794-1.777,1.763,0,2.205,2.303,3.56,3.031,3.934Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.503,5.144l.713,.393c.638,.352,1.034,.984,1.034,1.713"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,7.25c0-.728,.396-1.361,1.034-1.713l.713-.393"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,7.254v5.996c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V7.25l6.815,3.29c.275,.133,.595,.133,.869,0l6.815-3.29v.004h0Z"
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

export default envelopeOpenHeart;

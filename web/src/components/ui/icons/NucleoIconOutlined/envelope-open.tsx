import React from 'react';

import type { iconProps } from './iconProps';

function envelopeOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,6.75c0-.728,.396-1.361,1.034-1.713L8.517,1.874c.301-.166,.665-.166,.966,0l5.733,3.163c.638,.352,1.034,.984,1.034,1.713"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,6.754v6.496c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V6.75l6.815,3.29c.275,.133,.595,.133,.869,0l6.815-3.29v.004h0Z"
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

export default envelopeOpen;

import React from 'react';

import type { iconProps } from './iconProps';

function heart2Slash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.731,12.269l-2.932-3.047c-1.452-1.528-1.389-3.944,.139-5.395,1.528-1.452,3.944-1.389,5.395,.139,.27,.284,.495,.609,.666,.962,.998-2.056,3.598-2.813,5.57-1.497"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.158,5.731c.287,1.321-.113,2.602-.958,3.491l-5.48,5.694c-.393,.409-1.048,.409-1.441,0l-.732-.76"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.75 15.25L16 2"
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

export default heart2Slash;

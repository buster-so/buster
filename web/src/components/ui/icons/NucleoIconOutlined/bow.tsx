import React from 'react';

import type { iconProps } from './iconProps';

function bow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75 7L13 7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 7L5 7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.787,9.25c-.917,1.862-1.771,4.181-2.554,7l-.947-2.287-2.287,.947c.549-2.049,1.337-4.107,2.293-6.17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.311,14.693c.154,.501,.306,1.02,.455,1.557l.947-2.287,2.287,.947c-.549-2.049-1.337-4.107-2.293-6.17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,6c-1.139-1.282-2.43-2.342-4.136-2.798-.582-.156-1.182,.265-1.238,.865-.181,1.953-.092,3.722,.202,5.349,.092,.51,.581,.879,1.092,.797,1.325-.211,2.693-1.074,4.079-2.214"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,6c1.139-1.282,2.43-2.342,4.136-2.798,.582-.156,1.182,.265,1.238,.865,.181,1.953,.092,3.722-.202,5.349-.092,.51-.581,.879-1.092,.797-1.325-.211-2.693-1.074-4.079-2.214"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.25"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default bow;

import React from 'react';

import type { iconProps } from './iconProps';

function heart2List(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.947,15.222c-.244-.013-.484-.115-.668-.305L2.799,9.222c-1.452-1.528-1.389-3.944,.139-5.395,1.528-1.452,3.944-1.389,5.395,.139,.27,.284,.495,.609,.666,.962,1.074-2.212,4.002-2.92,6.007-1.162,.535,.469,.929,1.101,1.11,1.79,.25,.951,.14,1.888-.24,2.683"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 14.25L16.25 14.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 10.75L16.25 10.75"
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

export default heart2List;

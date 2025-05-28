import React from 'react';

import type { iconProps } from './iconProps';

function usersSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="7"
          cy="4.75"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.5"
          cy="13"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.233,6.86c.24,.087,.497,.14,.767,.14,1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25c-.27,0-.527,.052-.767,.14"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.676,10.208c-.793-.445-1.701-.708-2.676-.708-2.145,0-4,1.229-4.906,3.02-.4,.791,.028,1.757,.866,2.048,1.031,.358,2.408,.683,4.04,.683,.811,0,1.558-.081,2.231-.205"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.09 14.59L16.75 16.25"
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

export default usersSearch;

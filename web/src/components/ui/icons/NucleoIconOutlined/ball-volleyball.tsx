import React from 'react';

import type { iconProps } from './iconProps';

function ballVolleyball(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ball volleyball';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.917,10.537c.791,.29,1.627,.439,2.47,.441,1.727-.077,3.367-.78,4.613-1.977"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.868,13.253c-.312-.783-.758-1.506-1.318-2.135-1.209-1.235-2.826-1.988-4.55-2.118"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.883,1.753c-.44,.719-.751,1.509-.918,2.335-.263,1.709,.105,3.455,1.036,4.912"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.503,10.238c-1.246,2.519-3.139,4.191-8.505,4.01"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.806,10.769c-1.913-2.31-1.845-5.759-1.125-7.593"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.888,5.476c2.662-.601,5.112-.145,8.347,3.993"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default ballVolleyball;

import React from 'react';

import type { iconProps } from './iconProps';

function penNib3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen nib 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10 9.545L5.07 14.475"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.443,14.142c-1.275-1.003-1.607-1.893-1.666-2.538-.174-1.924,1.975-2.951,1.961-5.098-.009-1.377-.904-2.491-1.634-3.202"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.241,8.057l-1.592,4.496c-.117,.33-.397,.575-.74,.645l-7.157,1.481c-.528,.109-.996-.358-.886-.886l1.481-7.157c.071-.343,.316-.623,.645-.74l4.496-1.592"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.496,2.296l-.301,.301c-.391,.391-.391,1.024,0,1.414l2.169,2.169,2.169,2.169c.391,.391,1.024,.391,1.414,0l.301-.301"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="10"
          cy="9.545"
          fill="currentColor"
          r=".75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default penNib3;

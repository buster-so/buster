import React from 'react';

import type { iconProps } from './iconProps';

function userGlobe(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user globe';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="5.051"
          cy="9.25"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25,16.5c.525-1.597,2.028-2.75,3.801-2.75s3.276,1.153,3.801,2.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.101,11.145c.722,.374,1.53,.605,2.399,.605,2.899,0,5.25-2.351,5.25-5.25S14.399,1.25,11.5,1.25c-2.377,0-4.362,1.59-5.009,3.758"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.735 6.75L9.331 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="11.5"
          cy="6.5"
          fill="none"
          rx="2.172"
          ry="5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default userGlobe;

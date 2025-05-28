import React from 'react';

import type { iconProps } from './iconProps';

function fan(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px fan';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 16.25L7.25 13.24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 13.24L10.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,9.25c-.369,.617-.945,1.431-1.812,2.229-.992,.914-1.984,1.455-2.687,1.771h-1.75c-.583,0-1.167,0-1.75,0-.704-.316-1.695-.857-2.688-1.771-.867-.798-1.444-1.613-1.812-2.229"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,6.746c-3.013-1.3-5.698-1.497-7.25-1.497s-4.237,.198-7.25,1.497V3.247c3.013-1.3,5.698-1.497,7.25-1.497s4.237,.198,7.25,1.497v3.499Z"
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

export default fan;

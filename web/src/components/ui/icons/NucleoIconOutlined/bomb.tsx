import React from 'react';

import type { iconProps } from './iconProps';

function bomb(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bomb';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.341 5.659L14 4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75 2.25L16.5 1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 1.75L12.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 5.75L17.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5,7.157c-.256-.435-.643-.993-1.212-1.551-.519-.509-1.033-.864-1.445-1.106l-1.333,1.333c-.759-.37-1.609-.583-2.51-.583-3.176,0-5.75,2.574-5.75,5.75s2.574,5.75,5.75,5.75,5.75-2.574,5.75-5.75c0-.901-.213-1.751-.583-2.51,.534-.533,.799-.799,1.333-1.333Z"
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

export default bomb;

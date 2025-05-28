import React from 'react';

import type { iconProps } from './iconProps';

function bottleChampagne(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bottle champagne';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.543,7.684c-.313-.744-.543-1.454-.543-1.934V3.75l.5-.5V1.75c0-.552-.448-1-1-1h-1.5c-.552,0-1,.448-1,1v1.5l.5,.5v2c0,.88-.775,2.535-1.415,3.752-.542,1.03-.769,2.194-.658,3.353l.237,2.49c.049,.513,.48,.905,.995,.905h3.091"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.5 5.75L8 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25,6.75h3l.589,3.534c.215,1.291-.78,2.466-2.089,2.466h0c-1.309,0-2.304-1.175-2.089-2.466l.589-3.534Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 16.25L10.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 12.75L12.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.75" cy="12.25" fill="currentColor" r="1.5" />
      </g>
    </svg>
  );
}

export default bottleChampagne;

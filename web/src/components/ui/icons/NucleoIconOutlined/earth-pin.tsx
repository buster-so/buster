import React from 'react';

import type { iconProps } from './iconProps';

function earthPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px earth pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c-4.004,0-7.25-3.246-7.25-7.25S4.996,1.75,9,1.75c3.665,0,6.694,2.719,7.182,6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.771,9.887c-.044-.065-.855-1.323-.24-2.575,.067-.137,.484-.949,1.344-1.188,1.273-.353,2.203,.919,2.805,.535,.673-.429-.27-2.156,.507-3.129,.592-.741,1.896-.686,2.883-.531"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.771,9.887c1.589-.439,2.611-.224,3.292,.175"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.25c.017-.598-.07-1.358-.562-1.958-.521-.635-1.04-.548-1.422-1.182-.418-.694,.014-1.185-.297-2.047-.292-.809-.961-1.174-1.463-1.541-.836-.611-1.874-1.711-2.688-3.859"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14,16.75s-2.75-1.509-2.75-3.75c0-1.519,1.231-2.75,2.75-2.75s2.75,1.231,2.75,2.75c0,2.241-2.75,3.75-2.75,3.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="14" cy="13" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default earthPin;

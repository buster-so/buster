import React from 'react';

import type { iconProps } from './iconProps';

function earthLock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px earth lock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.771,9.887c-.044-.065-.855-1.323-.24-2.575,.067-.137,.484-.949,1.344-1.188,1.273-.353,2.203,.919,2.805,.535,.673-.429-.27-2.156,.507-3.129,.592-.741,1.896-.686,2.883-.531"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.771,9.887c1.589-.439,2.611-.224,3.292,.175,.703,.412,.917,.946,1.319,1.251"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.601,16.23c.148-.579,.234-1.343-.163-1.938-.423-.635-1.021-.517-1.422-1.182-.418-.694,.014-1.185-.297-2.047-.292-.809-.961-1.174-1.463-1.541-.836-.611-1.874-1.711-2.688-3.859"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.6,16.239c-3.818-.207-6.85-3.369-6.85-7.239C1.75,4.996,4.996,1.75,9,1.75c3.934,0,7.136,3.133,7.247,7.04"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,13.75v-1.5c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3.5"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="13.75"
        />
      </g>
    </svg>
  );
}

export default earthLock;

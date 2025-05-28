import React from 'react';

import type { iconProps } from './iconProps';

function earthAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px earth alert';

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
          d="M5.771,9.887c1.589-.439,2.611-.224,3.292,.175,.043,.025,.084,.051,.124,.077"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.174,13.325c-.056-.062-.109-.133-.159-.216-.418-.694,.014-1.185-.297-2.047-.292-.809-.961-1.174-1.463-1.541-.836-.611-1.874-1.711-2.688-3.859"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.619,15.85c-2.835-.985-4.869-3.68-4.869-6.85C1.75,4.996,4.996,1.75,9,1.75s7.25,3.246,7.25,7.25c0,.07,0,.14-.003,.209"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.5,16.25h.433c.788,0,1.267-.869,.845-1.535l-2.933-4.631c-.393-.62-1.297-.62-1.69,0l-2.933,4.631c-.422,.666,.057,1.535,.845,1.535h.433"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13 12.75L13 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="13" cy="17.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default earthAlert;

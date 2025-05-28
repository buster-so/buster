import React from 'react';

import type { iconProps } from './iconProps';

function pileOfPoo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pile of poo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="1.75" cy="4.25" fill="currentColor" r=".75" />
        <path
          d="M9.73,7.323l3.589,.305c.809,.069,1.431,.746,1.431,1.558,0,0,0,1.564-1.564,1.564"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.915,10.75c-2.071,0-1.915-1.915-1.915-1.915,0-1.122,.96-2.003,2.077-1.908l1.715,.146"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,10.75h2.25c2.25,0,2.25,2.25,2.25,2.25,0,1.243-1.007,2.25-2.25,2.25H4c-2.25,0-2.25-2.25-2.25-2.25,0-1.243,1.007-2.25,2.25-2.25h4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.888,.75c-.483,.483-.483,1.267,0,1.75s.483,1.267,0,1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.792,7.073s-1.646-.88-1.646-2.677c0-1.656,1.604-2.646,1.604-2.646,.187,1.406,.708,2.188,2.562,2.417l1.744,.217c.824,.102,1.443,.803,1.443,1.633,0,0,0,1.171-.898,1.467"
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

export default pileOfPoo;

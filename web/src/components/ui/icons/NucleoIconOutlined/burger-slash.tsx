import React from 'react';

import type { iconProps } from './iconProps';

function burgerSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px burger slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.474,10.526c-.247-.157-.522-.276-.89-.276-1.065,0-1.352,1-2.417,1s-1.352-1-2.417-1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,10.25c-1.065,0-1.352,1-2.417,1s-1.352-1-2.417-1c-.154,0-.291,.021-.417,.056"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5,7.75h1.398c.324,0,.564-.299,.488-.615-.053-.222-.13-.491-.238-.786"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.805,4.195c-.82-.814-2.028-1.445-3.805-1.445h-1c-.304,0-.637,0-1,0-3.905,0-5.065,3.05-5.386,4.385-.076,.316,.163,.615,.488,.615h7.148"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15,13.25s-.25,2-3.25,2c-.859,0-4.641,0-5.5,0-.086,0-.169-.002-.25-.005"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="7.75" cy="5" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default burgerSlash;

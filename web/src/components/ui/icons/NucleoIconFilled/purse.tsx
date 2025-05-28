import React from 'react';

import type { iconProps } from './iconProps';

function purse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px purse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="7.5" cy="2" fill="currentColor" r="1" />
        <circle cx="10.5" cy="2" fill="currentColor" r="1" />
        <path
          d="M14.769,7.215c-1.91-.221-3.844-.338-5.769-.338-1.939,0-3.887,.118-5.797,.34l-1.103,4.018c-.32,1.14-.094,2.335,.621,3.28,.715,.944,1.805,1.485,2.989,1.485h6.58c1.184,0,2.273-.542,2.989-1.485,.715-.944,.941-2.14,.621-3.28l-1.131-4.02Z"
          fill="currentColor"
        />
        <path
          d="M15.251,5.75c-.03,0-.06-.002-.091-.005-4.074-.49-8.246-.49-12.32,0-.418,.049-.785-.244-.834-.655-.049-.412,.244-.785,.655-.834,4.193-.505,8.486-.505,12.68,0,.411,.049,.704,.423,.655,.834-.046,.38-.37,.66-.744,.66Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default purse;

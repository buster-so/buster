import React from 'react';

import type { iconProps } from './iconProps';

function bowTie(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bow tie';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75,10.25c.415,.508,1.118,1.241,2.191,1.875,.804,.475,1.584,.757,2.232,.927,.544,.143,1.096-.216,1.217-.765,.284-1.282,.36-2.409,.36-3.286s-.076-2.005-.36-3.286c-.122-.549-.673-.908-1.217-.765-.647,.17-1.427,.451-2.232,.927-1.073,.634-1.776,1.367-2.191,1.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,10.25c-.415,.508-1.118,1.241-2.191,1.875-.804,.475-1.584,.757-2.232,.927-.544,.143-1.096-.216-1.217-.765-.284-1.282-.36-2.409-.36-3.286s.076-2.005,.36-3.286c.122-.549,.673-.908,1.217-.765,.647,.17,1.427,.451,2.232,.927,1.073,.634,1.776,1.367,2.191,1.875"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 9L13.25 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 9L4.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="5.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="7.25"
          y="6.25"
        />
      </g>
    </svg>
  );
}

export default bowTie;

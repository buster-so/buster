import React from 'react';

import type { iconProps } from './iconProps';

function trousers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trousers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.094,6.75s-.573,1.75-2.344,1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.906,6.75s.573,1.75,2.344,1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25 1.75L7.25 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75 1.75L10.75 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 4.25L3.75 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,4.25l.457,10.958c.024,.568-.431,1.042-.999,1.042h-2.378c-.481,0-.894-.343-.983-.816l-1.347-7.184-1.347,7.184c-.089,.473-.502,.816-.983,.816h-2.378c-.569,0-1.023-.474-.999-1.042l.457-10.958v-1.5c0-.552,.448-1,1-1H13.25c.552,0,1,.448,1,1,0,0,0,1.5,0,1.5Z"
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

export default trousers;

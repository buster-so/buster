import React from 'react';

import type { iconProps } from './iconProps';

function thread(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px thread';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.933,7.567c.316,1.344-.517,2.69-1.861,3.006l-1.822,.429"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 11L4.75 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 8L4.75 10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 5L4.75 7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.556,13.496l.991,1.61c.308,.5-.052,1.143-.639,1.143H4.092c-.587,0-.946-.643-.639-1.143l1.297-2.107V7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.444,4.504l-.991-1.61c-.308-.5,.052-1.143,.639-1.143H13.908c.587,0,.946,.643,.639,1.143l-1.297,2.107v6"
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

export default thread;

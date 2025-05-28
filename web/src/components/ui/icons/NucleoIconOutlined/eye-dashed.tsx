import React from 'react';

import type { iconProps } from './iconProps';

function eyeDashed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eye dashed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.848,5.806c.45-.405,.966-.79,1.55-1.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.346,3.871c-.425-.078-.874-.121-1.346-.121s-.92,.043-1.346,.121"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.152,5.806c-.45-.405-.966-.79-1.55-1.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.848,12.194c.45,.405,.966,.79,1.55,1.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.264,10.392c-.062-.089-.121-.176-.176-.259-.225-.341-.338-.737-.338-1.132,0-.395,.113-.791,.338-1.132,.055-.084,.114-.17,.176-.259"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.346,14.129c-.425,.078-.874,.121-1.346,.121-.472,0-.92-.043-1.346-.121"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.152,12.194c-.45,.405-.966,.79-1.55,1.116"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.736,10.392c.062-.089,.121-.176,.176-.259,.225-.341,.338-.737,.338-1.132,0-.395-.113-.791-.338-1.132-.055-.084-.114-.17-.176-.259"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default eyeDashed;

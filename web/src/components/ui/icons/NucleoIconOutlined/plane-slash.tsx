import React from 'react';

import type { iconProps } from './iconProps';

function planeSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px plane slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,10.358l-6,.892v-1.574c0-.408,.248-.776,.627-.928l5.373-2.154"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,10.396l6,.854v-1.574c0-.408-.248-.776-.627-.928l-2.373-.963"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.562,13.974l.282,1.789c.09,.569,.58,.988,1.156,.988h0c.576,0,1.066-.419,1.156-.988l.472-2.987c.081-.516,.122-1.037,.122-1.56v-.82"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.75,7.25V3.5c0-.966-.784-1.75-1.75-1.75h0c-.966,0-1.75,.784-1.75,1.75v7.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.156,15.762l.357-2.26,2.902,1.332c.357,.164,.585,.52,.585,.912v.756c0,.296-.256,.526-.55,.496l-3.895-.407c.308-.17,.543-.46,.601-.828Z"
          fill="currentColor"
        />
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.844,15.762l-.331-2.094-3.257,3.257c.087,.05,.185,.083,.294,.072l3.895-.407c-.308-.17-.543-.46-.601-.828Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default planeSlash;

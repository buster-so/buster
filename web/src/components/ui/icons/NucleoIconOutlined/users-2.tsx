import React from 'react';

import type { iconProps } from './iconProps';

function users2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.04,14.817c.837-.291,1.266-1.257,.866-2.048-.906-1.791-2.761-3.02-4.906-3.02s-4,1.228-4.906,3.02c-.4,.791,.028,1.757,.866,2.048,1.031,.358,2.408,.683,4.04,.683s3.009-.325,4.04-.683Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.53,13.555c.594-.115,1.119-.269,1.566-.428,.702-.25,1.01-1.077,.675-1.743-.786-1.563-2.402-2.635-4.271-2.635-.255,0-.505,.02-.748,.058"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.953,6.167c.177,.045,.356,.083,.547,.083,1.243,0,2.25-1.007,2.25-2.25s-1.007-2.25-2.25-2.25c-.334,0-.647,.082-.933,.213"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7"
          cy="4.5"
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

export default users2;

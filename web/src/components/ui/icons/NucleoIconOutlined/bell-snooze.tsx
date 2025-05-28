import React from 'react';

import type { iconProps } from './iconProps';

function bellSnooze(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bell snooze';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.588,15.185c-.095-.117-.237-.185-.388-.185h-2.399c-.151,0-.293,.068-.388,.185-.095,.117-.132,.271-.101,.418,.173,.822,.868,1.397,1.689,1.397s1.516-.575,1.689-1.397c.031-.147-.006-.301-.101-.418h-.001Z"
          fill="currentColor"
        />
        <path
          d="M10.37,1.975c-.437-.132-.89-.225-1.37-.225-2.623,0-4.75,2.127-4.75,4.75v4.75c0,1.105-.895,2-2,2H15.75c-1.105,0-2-.895-2-2v-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 1.25L16.25 1.25 12.75 5.25 16.25 5.25"
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

export default bellSnooze;

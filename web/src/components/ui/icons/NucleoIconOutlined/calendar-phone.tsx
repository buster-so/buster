import React from 'react';

import type { iconProps } from './iconProps';

function calendarPhone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar phone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.75 2.75L5.75 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 2.75L12.25 0.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.25 6.25L15.75 6.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.75,11.446V4.75c0-1.104-.895-2-2-2H4.25c-1.105,0-2,.896-2,2V13.25c0,1.104,.895,2,2,2h4.636"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.416,12.905l1.604-1.382c.177-.142,.237-.386,.145-.593l-.359-.882c-.099-.224-.346-.342-.583-.281l-1.111,.365c-.214,.07-.365,.277-.351,.502,.19,3.009,2.596,5.415,5.605,5.605,.225,.014,.432-.136,.502-.351l.365-1.111c.061-.237-.057-.483-.281-.583l-.882-.359c-.208-.092-.451-.033-.593,.145l-1.382,1.604"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default calendarPhone;

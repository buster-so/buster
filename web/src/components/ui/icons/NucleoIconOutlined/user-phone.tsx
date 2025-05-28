import React from 'react';

import type { iconProps } from './iconProps';

function userPhone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user phone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.373,9.797c-2.277,.229-4.194,1.666-5.083,3.674-.365,.825,.087,1.774,.947,2.045,1.225,.386,2.846,.734,4.762,.734,.58,0,1.123-.04,1.647-.095"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.416,12.905l1.604-1.382c.177-.142,.237-.386,.145-.593l-.359-.882c-.099-.224-.346-.342-.583-.281l-1.111,.365c-.214,.07-.365,.277-.351,.502,.19,3.009,2.596,5.415,5.605,5.605,.225,.014,.432-.136,.502-.351l.365-1.111c.061-.237-.057-.483-.281-.583l-.882-.359c-.208-.092-.451-.033-.593,.145l-1.382,1.604"
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

export default userPhone;

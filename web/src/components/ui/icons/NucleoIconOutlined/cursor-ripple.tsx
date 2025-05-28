import React from 'react';

import type { iconProps } from './iconProps';

function cursorRipple(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cursor ripple';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.004,5.79c-.55-.632-1.351-1.04-2.254-1.04-1.657,0-3,1.343-3,3,0,.904,.408,1.704,1.04,2.254"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.707,7.061c-.342-2.989-2.877-5.311-5.957-5.311C4.436,1.75,1.75,4.436,1.75,7.75c0,3.08,2.322,5.615,5.311,5.958"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.095,7.778l7.314,2.51c.222,.076,.226,.388,.007,.47l-3.279,1.233c-.067,.025-.121,.079-.146,.146l-1.233,3.279c-.083,.219-.394,.215-.47-.007l-2.51-7.314c-.068-.197,.121-.385,.318-.318Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.031 12.031L16.243 16.243"
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

export default cursorRipple;

import React from 'react';

import type { iconProps } from './iconProps';

function signature3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px signature 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M0.75 12.25L17.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 5.75L4.25 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 5.75L0.75 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.605,7.043c-2.828-1.258-2.271-4.867,.649-4.52,2.463,.293,4.082,5.945,3.68,10.372-.083,.913-.407,2.362-1.691,2.573-.96,.158-1.979-.276-2.418-1.193-1.591-3.497,4.057-9.262,6.166-8.158,1.132,.593,.419,2.574,1.307,2.769,.35,.077,.702-.192,.944-.564"
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

export default signature3;

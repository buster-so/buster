import React from 'react';

import type { iconProps } from './iconProps';

function rings2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rings 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,12.562c-.761,.588-1.715,.938-2.75,.938-2.485,0-4.5-2.015-4.5-4.5S3.765,4.5,6.25,4.5s4.5,2.015,4.5,4.5c0,.542-.096,1.061-.271,1.542"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,5.438c.76-.588,1.714-.938,2.75-.938,2.485,0,4.5,2.015,4.5,4.5s-2.015,4.5-4.5,4.5-4.5-2.015-4.5-4.5c0-.542,.096-1.061,.271-1.542"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.074,1.853l-.655-.696c-.095-.1-.227-.157-.364-.157h-1.61c-.138,0-.27,.057-.364,.157l-.655,.696c-.167,.177-.182,.449-.035,.644l1.46,1.938c.095,.125,.242,.199,.399,.199s.305-.074,.399-.199l1.46-1.938c.146-.194,.131-.466-.035-.644Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rings2;

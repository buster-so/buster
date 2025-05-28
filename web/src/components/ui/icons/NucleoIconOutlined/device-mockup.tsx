import React from 'react';

import type { iconProps } from './iconProps';

function deviceMockup(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px device mockup';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.829,8.709l3.694,1.965c.542,.289,1.194,.284,1.732-.012l8.924-4.906c.432-.237,.428-.859-.007-1.091l-3.694-1.965c-.542-.289-1.194-.284-1.732,.012L1.821,7.618c-.432,.237-.428,.859,.007,1.091Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.462,11.878l-.641,.352c-.432,.237-.428,.859,.007,1.091l3.694,1.965c.542,.289,1.194,.284,1.732-.012l8.924-4.906c.432-.237,.428-.859-.007-1.091l-.614-.327"
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

export default deviceMockup;

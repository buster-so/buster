import React from 'react';

import type { iconProps } from './iconProps';

function glassJuice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px glass juice';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.5,3.5h0c.276,0,.5,.224,.5,.5h0c0,1.38-1.12,2.5-2.5,2.5h0c-.276,0-.5-.224-.5-.5h0c0-1.38,1.12-2.5,2.5-2.5Z"
          fill="currentColor"
        />
        <path
          d="M2.75,5.75h6.5l-.227,9.524c-.013,.543-.457,.976-1,.976H3.976c-.543,0-.987-.433-1-.976l-.227-9.524Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,1.75H3.855c.51,0,.938,.383,.994,.89l1.151,10.36"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,8.258c.083-.005,.166-.008,.25-.008,2.209,0,4,1.791,4,4s-1.791,4-4,4c-.184,0-.365-.012-.542-.036"
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

export default glassJuice;

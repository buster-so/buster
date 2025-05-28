import React from 'react';

import type { iconProps } from './iconProps';

function pyramid(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pyramid';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 1.751L9 15.999"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.802,2.151l5.857,7.838c.327,.438,.239,1.057-.198,1.387l-5.857,4.422c-.357,.27-.851,.27-1.209,0L2.539,11.376c-.437-.33-.525-.949-.198-1.387L8.198,2.151c.4-.535,1.205-.535,1.605,0Z"
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

export default pyramid;

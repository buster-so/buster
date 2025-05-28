import React from 'react';

import type { iconProps } from './iconProps';

function sneeze(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sneeze';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="6.25" cy="7.25" fill="currentColor" r=".75" />
        <circle cx="12.75" cy="11.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="9.75" fill="currentColor" r=".75" />
        <circle cx="15.25" cy="13.75" fill="currentColor" r=".75" />
        <path
          d="M5.25,16.25v-2.5h1.639c1.049,0,1.919-.81,1.995-1.856l.112-1.543,1.504-.601-1.5-2c0-3.397-2.823-6.134-6.25-5.995"
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

export default sneeze;

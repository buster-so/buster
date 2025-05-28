import React from 'react';

import type { iconProps } from './iconProps';

function watch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px watch';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,4.75l.361-2.164c.08-.482,.498-.836,.986-.836h2.806c.489,0,.906,.353,.986,.836l.361,2.164"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,13.25l.361,2.164c.08,.482,.498,.836,.986,.836h2.806c.489,0,.906-.353,.986-.836l.361-2.164"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 7L9 9 11 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="8.5"
          width="9.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="4.25"
          y="4.75"
        />
      </g>
    </svg>
  );
}

export default watch;

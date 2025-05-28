import React from 'react';

import type { iconProps } from './iconProps';

function database(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px database';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.25,1.688c-.414,0-.75.336-.75.75v3.55c-.081.262-1.278.95-3.5.95s-3.408-.681-3.5-.947v-3.553c0-.414-.336-.75-.75-.75s-.75.336-.75.75v7.125c0,1.675,2.592,2.438,5,2.438s5-.763,5-2.438V2.438c0-.414-.336-.75-.75-.75Zm-4.25,8.812c-2.224,0-3.422-.689-3.5-.938v-1.761c.96.43,2.253.636,3.5.636s2.541-.207,3.501-.637v1.748c-.079.262-1.277.951-3.501.951Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <ellipse cx="6" cy="2.438" fill="currentColor" rx="5" ry="2.438" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default database;

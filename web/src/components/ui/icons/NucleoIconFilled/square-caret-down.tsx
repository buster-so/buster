import React from 'react';

import type { iconProps } from './iconProps';

function squareCaretDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square caret down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.607,6.17l-2.022,2.987c-.297,.439-.945,.439-1.242,0l-2.022-2.987c-.337-.498,.02-1.17,.621-1.17h4.044c.601,0,.958,.672,.621,1.17Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareCaretDown;

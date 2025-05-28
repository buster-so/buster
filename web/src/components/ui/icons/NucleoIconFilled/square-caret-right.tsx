import React from 'react';

import type { iconProps } from './iconProps';

function squareCaretRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square caret right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.093,7.621l-2.987,2.022c-.498,.337-1.17-.02-1.17-.621V6.978c0-.602,.672-.958,1.17-.621l2.987,2.022c.439,.297,.439,.945,0,1.242Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareCaretRight;

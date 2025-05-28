import React from 'react';

import type { iconProps } from './iconProps';

function select(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px select';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25,13.25H3.75c-1.105,0-2-.895-2-2V6.75c0-1.105,.895-2,2-2h7.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.5,8h3c.189,0,.362-.107,.447-.276,.084-.169,.066-.372-.047-.523l-1.5-2c-.188-.252-.611-.252-.8,0l-1.5,2c-.114,.151-.132,.354-.047,.523,.085,.169,.258,.276,.447,.276Z"
          fill="currentColor"
        />
        <path
          d="M16.5,10h-3c-.189,0-.362,.107-.447,.276-.084,.169-.066,.372,.047,.523l1.5,2c.094,.126,.243,.2,.4,.2s.306-.074,.4-.2l1.5-2c.114-.151,.132-.354,.047-.523-.085-.169-.258-.276-.447-.276Z"
          fill="currentColor"
        />
        <path
          d="M4.75 9L9 9"
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

export default select;

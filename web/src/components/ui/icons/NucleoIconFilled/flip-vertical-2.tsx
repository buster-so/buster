import React from 'react';

import type { iconProps } from './iconProps';

function flipVertical2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip vertical 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,8H14.148c.47,0,.87-.32,.975-.778s-.119-.92-.544-1.125L4.789,1.415c-.169-.081-.351-.122-.539-.122-.689,0-1.25,.561-1.25,1.25V7.25c0,.414,.336,.75,.75,.75Zm.75-5.061l7.444,3.561H4.5V2.939Z"
          fill="currentColor"
        />
        <path
          d="M14.148,10H3.75c-.414,0-.75,.336-.75,.75v4.707c0,.689,.561,1.25,1.25,1.25,.188,0,.37-.041,.539-.122l9.791-4.683c.424-.204,.647-.666,.543-1.124s-.505-.778-.975-.778Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flipVertical2;

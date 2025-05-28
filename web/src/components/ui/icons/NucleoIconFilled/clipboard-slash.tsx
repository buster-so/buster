import React from 'react';

import type { iconProps } from './iconProps';

function clipboardSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clipboard slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.734,16.948c.168,.032,.339,.052,.516,.052h7.5c1.517,0,2.75-1.233,2.75-2.75V6.182L4.734,16.948Z"
          fill="currentColor"
        />
        <path
          d="M15.12,3.38c-.476-.821-1.355-1.38-2.37-1.38h-.275c-.123-.846-.845-1.5-1.725-1.5h-3.5c-.879,0-1.602,.654-1.725,1.5h-.275c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,.501,.145,.965,.38,1.37L15.12,3.38ZM7,2.25c0-.138,.112-.25,.25-.25h3.5c.138,0,.25,.112,.25,.25v1c0,.138-.112,.25-.25,.25h-3.5c-.138,0-.25-.112-.25-.25v-1Z"
          fill="currentColor"
        />
        <path
          d="M2.25,17c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.78,16.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clipboardSlash;

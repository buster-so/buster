import React from 'react';

import type { iconProps } from './iconProps';

function stackPerspective3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px stack perspective 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.144,2.016c-.218-.442-.749-.687-1.253-.493L3.391,3.253c-.386,.148-.641,.52-.641,.933v6.607c0,.379,.208,.689,.5,.859"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.144,4.516c-.218-.442-.749-.687-1.253-.493l-4.5,1.731c-.386,.148-.641,.52-.641,.933v6.607c0,.379,.208,.689,.5,.859"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.391,8.253l4.5-1.731c.655-.252,1.359,.232,1.359,.933v6.607c0,.414-.255,.785-.641,.933l-4.5,1.731c-.655,.252-1.359-.232-1.359-.933v-6.607c0-.414,.255-.785,.641-.933Z"
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

export default stackPerspective3;

import React from 'react';

import type { iconProps } from './iconProps';

function filmPlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px film play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM6,3.5h2.25v1.5h-2.25v-1.5Zm-1.5,11h-.75c-.689,0-1.25-.561-1.25-1.25v-.25h2v1.5Zm0-9.5H2.5v-.25c0-.689,.561-1.25,1.25-1.25h.75v1.5Zm3.75,9.5h-2.25v-1.5h2.25v1.5Zm-.75-4.114v-2.771c0-.473,.514-.768,.922-.53l2.375,1.386c.406,.237,.406,.823,0,1.06l-2.375,1.386c-.409,.239-.922-.056-.922-.53Zm4.5,4.114h-2.25v-1.5h2.25v1.5Zm0-9.5h-2.25v-1.5h2.25v1.5Zm3.5,8.25c0,.689-.561,1.25-1.25,1.25h-.75v-1.5h2v.25Zm0-8.25h-2v-1.5h.75c.689,0,1.25,.561,1.25,1.25v.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default filmPlay;

import React from 'react';

import type { iconProps } from './iconProps';

function copies3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copies 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="10" width="10" fill="currentColor" rx="2.75" ry="2.75" x="1" y="1" />
        <path
          d="M14,11.25V6.75c0-.692-.259-1.354-.728-1.863-.279-.305-.756-.324-1.06-.044-.305,.28-.324,.755-.044,1.06,.214,.232,.331,.533,.331,.848v4.5c0,.689-.561,1.25-1.25,1.25H6.75c-.314,0-.616-.118-.847-.331-.305-.281-.778-.261-1.061,.043-.28,.305-.261,.779,.043,1.06,.51,.47,1.172,.728,1.864,.728h4.5c1.517,0,2.75-1.234,2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M16.272,7.887c-.279-.305-.755-.324-1.06-.044s-.324,.755-.044,1.06c.214,.232,.331,.533,.331,.848v4.5c0,.689-.561,1.25-1.25,1.25h-4.5c-.314,0-.616-.118-.847-.331-.305-.281-.778-.262-1.061,.043-.28,.305-.261,.779,.043,1.06,.51,.47,1.172,.728,1.864,.728h4.5c1.517,0,2.75-1.234,2.75-2.75v-4.5c0-.692-.259-1.354-.728-1.863Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default copies3;

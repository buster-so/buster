import React from 'react';

import type { iconProps } from './iconProps';

function suitcase2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17,7.519v-.769c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.769c2.394,1.259,5.113,1.981,8,1.981s5.606-.722,8-1.981Z"
          fill="currentColor"
        />
        <path
          d="M9,11c-2.864,0-5.57-.665-8-1.818v4.068c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-4.068c-2.43,1.153-5.136,1.818-8,1.818Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcase2;

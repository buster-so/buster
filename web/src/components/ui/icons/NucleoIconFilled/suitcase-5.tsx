import React from 'react';

import type { iconProps } from './iconProps';

function suitcase5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.433,9c.045-.557,.499-1,1.067-1h1c.568,0,1.022,.443,1.067,1h6.433v-2.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v2.25H7.433Z"
          fill="currentColor"
        />
        <path
          d="M10.567,10.5c-.045,.557-.499,1-1.067,1h-1c-.568,0-1.022-.443-1.067-1H1v2.75c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75v-2.75h-6.433Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcase5;

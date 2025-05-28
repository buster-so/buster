import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,4H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h7.25v-4.25c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v3.936c.886-.457,1.5-1.371,1.5-2.436V6.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,11c-.414,0-.75,.336-.75,.75v2.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="13.25" cy="16.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default suitcaseAlert;

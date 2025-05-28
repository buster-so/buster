import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.5,14.75c0-2.068,1.683-3.75,3.75-3.75,1.192,0,2.293,.574,2.988,1.5h1.762V6.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h4.98c-.14-.393-.23-.81-.23-1.25Z"
          fill="currentColor"
        />
        <path
          d="M17.25,14h-2.888c-.311-.871-1.136-1.5-2.112-1.5-1.24,0-2.25,1.009-2.25,2.25s1.01,2.25,2.25,2.25c.976,0,1.801-.629,2.112-1.5h1.138v.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-5,1.5c-.413,0-.75-.336-.75-.75s.337-.75,.75-.75,.75,.336,.75,.75-.337,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseKey;

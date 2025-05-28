import React from 'react';

import type { iconProps } from './iconProps';

function colorPalette(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px color palette';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.5,4.135v-.385c0-.965-.785-1.75-1.75-1.75H3.75c-.965,0-1.75,.785-1.75,1.75v5.885L7.5,4.135Z"
          fill="currentColor"
        />
        <path
          d="M14.25,10H5c-1.654,0-3,1.346-3,3s1.346,3,3,3H14.25c.965,0,1.75-.785,1.75-1.75v-2.5c0-.965-.785-1.75-1.75-1.75Zm-9.25,3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm5.5,.75h-2.5v-3h2.5v3Zm4-.25c0,.138-.112,.25-.25,.25h-2.25v-3h2.25c.138,0,.25,.112,.25,.25v2.5Z"
          fill="currentColor"
        />
        <path
          d="M13.034,8.5l.274-.274c.682-.682,.682-1.793,0-2.475l-1.414-1.414c-.682-.682-1.793-.682-2.475,0l-4.163,4.163h7.778Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default colorPalette;

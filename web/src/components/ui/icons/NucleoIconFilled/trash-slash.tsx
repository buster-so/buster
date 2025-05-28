import React from 'react';

import type { iconProps } from './iconProps';

function trashSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trash slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m13.25,4.75H3.651c0,.014-.007.026-.006.04l.479,9.086L13.25,4.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.973,16.209c.497.488,1.176.791,1.925.791h4.205c1.463,0,2.669-1.145,2.746-2.605l.393-7.454-9.268,9.269Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.75,5.5h9.75l1.5-1.5h-2v-1.25c0-.965-.785-1.75-1.75-1.75h-2.5c-.965,0-1.75.785-1.75,1.75v1.25h-3.25c-.414,0-.75.336-.75.75s.336.75.75.75Zm4.75-2.75c0-.138.112-.25.25-.25h2.5c.138,0,.25.112.25.25v1.25h-3v-1.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061L2.53,16.53c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default trashSlash;

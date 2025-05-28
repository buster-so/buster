import React from 'react';

import type { iconProps } from './iconProps';

function trash2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px trash 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m14.349,4.75H3.651c0,.014-.007.026-.006.04l.506,9.604c.077,1.461,1.283,2.606,2.746,2.606h4.205c1.463,0,2.669-1.145,2.746-2.605l.506-9.605c0-.014-.006-.026-.006-.04Zm-6.932,9.249c-.014,0-.028,0-.042,0-.396,0-.726-.309-.749-.708l-.25-4.5c-.023-.414.294-.768.708-.791.414-.016.767.294.791.708l.25,4.5c.023.414-.294.768-.708.791Zm3.958-.708c-.022.399-.353.708-.749.708-.014,0-.028,0-.042,0-.414-.023-.73-.377-.708-.791l.25-4.5c.023-.413.357-.722.791-.708.414.023.73.377.708.791l-.25,4.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m15.25,4h-3.25v-1.25c0-.965-.785-1.75-1.75-1.75h-2.5c-.965,0-1.75.785-1.75,1.75v1.25h-3.25c-.414,0-.75.336-.75.75s.336.75.75.75h12.5c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Zm-7.75-1.25c0-.138.112-.25.25-.25h2.5c.138,0,.25.112.25.25v1.25h-3v-1.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default trash2;

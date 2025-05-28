import React from 'react';

import type { iconProps } from './iconProps';

function greekTemple(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px greek temple';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,14.5h-.25v-4.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.75h-2v-4.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.75h-2v-4.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.75h-2v-4.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.75h-.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.105,4.309L9.855,1.369c-.527-.296-1.182-.295-1.71,0L2.894,4.31c-.552,.31-.894,.895-.894,1.526v.414c0,.965,.785,1.75,1.75,1.75H14.25c.965,0,1.75-.785,1.75-1.75v-.414c0-.632-.342-1.217-.895-1.527Zm-6.105,1.441c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default greekTemple;

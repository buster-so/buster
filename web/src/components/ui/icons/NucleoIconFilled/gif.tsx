import React from 'react';

import type { iconProps } from './iconProps';

function gif(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gif';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.75,14c-.414,0-.75-.336-.75-.75V4.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.241,5.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4.491c-.414,0-.75,.336-.75,.75V13.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.75h3.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.25v-2.5h3.741Z"
          fill="currentColor"
        />
        <path
          d="M4,14C1.682,14,0,11.897,0,9S1.682,4,4,4c1.527,0,2.799,.892,3.489,2.446,.168,.378-.002,.822-.381,.99-.379,.168-.822-.003-.99-.381-.258-.581-.875-1.554-2.118-1.554-1.641,0-2.5,1.761-2.5,3.5s.859,3.5,2.5,3.5c1.451,0,2.174-1.185,2.414-2.5h-1.914c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.75c.205,0,.4,.083,.542,.231s.216,.347,.207,.552c-.125,2.821-1.732,4.717-3.999,4.717Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gif;

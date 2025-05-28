import React from 'react';

import type { iconProps } from './iconProps';

function images2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px images 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M8,7c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z" fill="currentColor" />
        <path
          d="M13.737,6.513c-.683-.683-1.792-.683-2.475,0l-5.48,5.478c.288,.16,.614,.26,.967,.26h7.5c1.105,0,2-.896,2-2v-1.225l-2.513-2.513Z"
          fill="currentColor"
        />
        <path
          d="M12.25,16H3.75c-1.517,0-2.75-1.233-2.75-2.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.689,.561,1.25,1.25,1.25H12.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,13H6.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75h7.5c1.517,0,2.75,1.233,2.75,2.75v5.5c0,1.517-1.233,2.75-2.75,2.75ZM6.75,3.5c-.689,0-1.25,.561-1.25,1.25v5.5c0,.689,.561,1.25,1.25,1.25h7.5c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H6.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default images2;

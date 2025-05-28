import React from 'react';

import type { iconProps } from './iconProps';

function rulerTriangle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ruler triangle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.823,13.013L4.987,2.177c-.503-.502-1.251-.652-1.907-.379-.656,.272-1.08,.906-1.08,1.617v2.586h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.5v1h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.5v1h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-1.5v1.75c0,.965,.785,1.75,1.75,1.75h1.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h1v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h1v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5h2.586c.71,0,1.345-.424,1.616-1.08,.272-.657,.123-1.405-.379-1.907Zm-7.398-1.013h-1.926c-.276,0-.5-.224-.5-.5v-1.925c0-.446,.539-.668,.854-.354l1.926,1.925c.315,.315,.092,.854-.354,.854Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default rulerTriangle;

import React from 'react';

import type { iconProps } from './iconProps';

function caretRightFromLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret right from line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,2.5c-.414,0-.75,.336-.75,.75V14.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.07,7.522h0L7.687,2.84c-.539-.343-1.222-.363-1.779-.056-.56,.308-.907,.896-.907,1.534V13.682c0,.638,.348,1.226,.907,1.534,.263,.145,.553,.216,.843,.216,.326,0,.651-.091,.937-.272l7.384-4.682c.509-.323,.812-.875,.812-1.478s-.304-1.155-.812-1.478Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretRightFromLine;

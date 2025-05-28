import React from 'react';

import type { iconProps } from './iconProps';

function bagPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.5,15.75v-.25h-.25c-1.241,0-2.25-1.009-2.25-2.25s1.009-2.25,2.25-2.25h.25v-.25c0-1.241,1.009-2.25,2.25-2.25,.299,0,.582,.061,.843,.167l-.188-2.156c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.652,7.5c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892H12.881c-.24-.358-.381-.788-.381-1.25ZM7.5,3c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1h-3v-1Z"
          fill="currentColor"
        />
        <path
          d="M17.25,12.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagPlus;

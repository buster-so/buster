import React from 'react';

import type { iconProps } from './iconProps';

function angle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px angle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M5,13h5.164c-.75-2.467-2.698-4.415-5.164-5.165v5.165Z" fill="currentColor" />
        <path
          d="M15.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.25c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default angle;

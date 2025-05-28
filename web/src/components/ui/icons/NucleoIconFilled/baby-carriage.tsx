import React from 'react';

import type { iconProps } from './iconProps';

function babyCarriage(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px baby carriage';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.25" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="13.75" cy="15.75" fill="currentColor" r="1.25" />
        <path
          d="M16,8H4.5v-1.75c0-1.243-1.007-2.25-2.25-2.25h-.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.5c.413,0,.75,.336,.75,.75v3.5c0,2.071,1.679,3.75,3.75,3.75h5.5c2.071,0,3.75-1.679,3.75-3.75v-1.75Z"
          fill="currentColor"
        />
        <path
          d="M15.95,6.5c-.372-3.093-3.008-5.5-6.2-5.5-.414,0-.75,.336-.75,.75V6.5h6.95Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default babyCarriage;

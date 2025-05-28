import React from 'react';

import type { iconProps } from './iconProps';

function pilcrow(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pilcrow';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,1H7.5C5.019,1,3,3.019,3,5.5s2.019,4.5,4.5,4.5v6.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.5h5.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-6.75,7.5c-1.654,0-3-1.346-3-3s1.346-3,3-3v6Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pilcrow;

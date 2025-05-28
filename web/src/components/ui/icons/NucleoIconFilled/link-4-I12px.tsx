import React from 'react';

import type { iconProps } from './iconProps';

function link4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,8c-.414,0-.75-.336-.75-.75v-2.25c0-1.378-1.121-2.5-2.5-2.5s-2.5,1.122-2.5,2.5v2.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.25c0-2.206,1.794-4,4-4s4,1.794,4,4v2.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,17c-2.206,0-4-1.794-4-4v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25c0,1.378,1.121,2.5,2.5,2.5s2.5-1.122,2.5-2.5v-2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.25c0,2.206-1.794,4-4,4Z"
          fill="currentColor"
        />
        <path
          d="M9,12c-.414,0-.75-.336-.75-.75V6.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default link4;

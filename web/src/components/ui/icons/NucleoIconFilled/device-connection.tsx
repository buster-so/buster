import React from 'react';

import type { iconProps } from './iconProps';

function deviceConnection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px device connection';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.5,16c-.551,0-1-.449-1-1s.449-1,1-1,1,.449,1,1-.449,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M4.75,16c-.414,0-.75-.336-.75-.75v-.25c0-1.378-1.122-2.5-2.5-2.5h-.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.25c2.206,0,4,1.794,4,4v.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,3H4.75c-1.517,0-2.75,1.233-2.75,2.75v.775c3.774,.221,6.888,2.908,7.753,6.475h4.497c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M7.75,16c-.414,0-.75-.336-.75-.75v-.25c0-3.033-2.467-5.5-5.5-5.5h-.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.25c3.86,0,7,3.14,7,7v.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default deviceConnection;

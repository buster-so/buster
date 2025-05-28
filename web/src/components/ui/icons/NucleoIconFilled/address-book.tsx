import React from 'react';

import type { iconProps } from './iconProps';

function addressBook(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px address book';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.25,7c-.414,0-.75-.336-.75-.75V3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.25,12c-.414,0-.75-.336-.75-.75v-2.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.75,1H5.25c-1.519,0-2.75,1.231-2.75,2.75v1.25h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v1.75h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v1.75h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h.75v1.25c0,1.519,1.231,2.75,2.75,2.75h7.5c1.519,0,2.75-1.231,2.75-2.75V3.75c0-1.519-1.231-2.75-2.75-2.75Zm-3.75,3c1.103,0,2,.897,2,2s-.897,2-2,2-2-.897-2-2,.897-2,2-2Zm3.601,8.684c-.142,.19-.364,.302-.601,.302H6c-.237,0-.459-.112-.601-.302s-.186-.435-.118-.662c.486-1.632,2.015-2.771,3.719-2.771s3.233,1.14,3.719,2.771c.068,.227,.024,.472-.118,.662Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default addressBook;

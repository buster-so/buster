import React from 'react';

import type { iconProps } from './iconProps';

function folder5Open(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder 5 open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.18,15.25h-.43c-1.105,0-2-.895-2-2V3.75c0-.552,.448-1,1-1h3.797c.288,0,.563,.125,.753,.342l2.325,2.658h5.626"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.187,8.25H5.308c-.472,0-.879,.329-.978,.79l-1.071,5c-.133,.623,.341,1.21,.978,1.21H15.115c.472,0,.879-.329,.978-.79l1.071-5c.133-.623-.341-1.21-.978-1.21Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default folder5Open;

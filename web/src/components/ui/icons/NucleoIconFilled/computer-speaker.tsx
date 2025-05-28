import React from 'react';

import type { iconProps } from './iconProps';

function computerSpeaker(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px computer speaker';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.25,11.5H2.75c-.965,0-1.75-.785-1.75-1.75V5.25c0-.965,.785-1.75,1.75-1.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H2.75c-.138,0-.25,.112-.25,.25v4.5c0,.138,.112,.25,.25,.25h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M2.753,14.747c-.225,0-.448-.1-.595-.292-.251-.326-.195-.792,.129-1.046,.048-.037,1.183-.909,2.962-.909,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-1.241,0-2.035,.588-2.043,.594-.136,.103-.295,.152-.454,.152Z"
          fill="currentColor"
        />
        <path
          d="M14.75,2h-5.5c-1.241,0-2.25,1.009-2.25,2.25V13.75c0,1.241,1.009,2.25,2.25,2.25h5.5c1.241,0,2.25-1.009,2.25-2.25V4.25c0-1.241-1.009-2.25-2.25-2.25Zm-2.75,3c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm0,7.5c-1.105,0-2-.896-2-2s.895-2,2-2,2,.896,2,2-.895,2-2,2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default computerSpeaker;

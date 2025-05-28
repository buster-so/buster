import React from 'react';

import type { iconProps } from './iconProps';

function balance2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px balance 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,7H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M10.135,10.155c-.474-.82-1.797-.82-2.271,0l-2.816,4.878c-.237,.411-.237,.9,0,1.311,.237,.41,.662,.655,1.135,.655h5.633c.474,0,.898-.245,1.135-.655,.237-.411,.237-.9,0-1.311l-2.816-4.878Z"
          fill="currentColor"
        />
        <circle cx="3.5" cy="3.5" fill="currentColor" r="2.5" />
        <circle cx="14.5" cy="3.5" fill="currentColor" r="2.5" />
      </g>
    </svg>
  );
}

export default balance2;

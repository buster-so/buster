import React from 'react';

import type { iconProps } from './iconProps';

function bagClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.5,14c0-3.033,2.467-5.5,5.5-5.5,.556,0,1.093,.084,1.599,.239l-.194-2.227c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.652,7.5c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892h4.715c-.565-.864-.896-1.893-.896-3ZM7.5,3c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1h-3v-1Z"
          fill="currentColor"
        />
        <path
          d="M14,10c-2.206,0-4,1.794-4,4s1.794,4,4,4,4-1.794,4-4-1.794-4-4-4Zm2.312,4.95c-.119,.29-.398,.465-.693,.465-.096,0-.191-.018-.285-.056l-1.619-.665c-.281-.116-.465-.39-.465-.694v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.247l1.154,.474c.383,.157,.566,.596,.408,.979Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagClock;

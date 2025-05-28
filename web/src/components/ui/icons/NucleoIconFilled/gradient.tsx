import React from 'react';

import type { iconProps } from './iconProps';

function gradient(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gradient';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.064,10.256c-.285-.326-.844-.326-1.129,0L.186,12.256c-.12,.137-.186,.312-.186,.494v1.5c0,.965,.785,1.75,1.75,1.75h1.5c.965,0,1.75-.785,1.75-1.75v-1.5c0-.182-.066-.357-.186-.494l-1.75-2Z"
          fill="currentColor"
        />
        <path
          d="M17.814,12.256l-1.75-2c-.285-.326-.844-.326-1.129,0l-1.75,2c-.12,.137-.186,.312-.186,.494v1.5c0,.965,.785,1.75,1.75,1.75h1.5c.965,0,1.75-.785,1.75-1.75v-1.5c0-.182-.066-.357-.186-.494Z"
          fill="currentColor"
        />
        <path
          d="M15.25,3H2.75c-.965,0-1.75,.785-1.75,1.75v2.5c0,.965,.785,1.75,1.75,1.75H15.25c.965,0,1.75-.785,1.75-1.75v-2.5c0-.965-.785-1.75-1.75-1.75Zm.25,4.25c0,.138-.112,.25-.25,.25h-3.25v-1.5h-2v1.5h-2v-1.5h-2v-1.5h2v1.5h2v-1.5h5.25c.138,0,.25,.112,.25,.25v2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gradient;

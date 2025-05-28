import React from 'react';

import type { iconProps } from './iconProps';

function volumeMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10,9c0-1.155,.878-2.099,2-2.225V2.664c0-.457-.249-.877-.65-1.097-.4-.219-.887-.203-1.273,.044l-5.296,3.389H2.25c-1.24,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.01,2.25,2.25,2.25h2.53l5.296,3.389c.205,.131,.439,.198,.674,.198,.206,0,.412-.051,.6-.153,.401-.219,.65-.64,.65-1.097v-4.112c-1.122-.126-2-1.07-2-2.225Z"
          fill="currentColor"
        />
        <path
          d="M17.25,9.75h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default volumeMinus;

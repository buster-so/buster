import React from 'react';

import type { iconProps } from './iconProps';

function volumeOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px volume off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,13h1.853L14.5,4.422v-1.758c0-.457-.249-.877-.65-1.097-.4-.219-.887-.203-1.273,.044l-5.296,3.389H3.75c-1.24,0-2.25,1.009-2.25,2.25v3.5c0,1.241,1.01,2.25,2.25,2.25Z"
          fill="currentColor"
        />
        <path
          d="M8.22,13.601l4.356,2.788c.205,.131,.439,.198,.674,.198,.206,0,.412-.051,.6-.153,.401-.219,.65-.64,.65-1.097V7.545l-6.28,6.056Z"
          fill="currentColor"
        />
        <path
          d="M2.75,16.5c-.196,0-.393-.077-.54-.229-.287-.298-.278-.773,.02-1.061L16.229,1.71c.299-.286,.773-.279,1.061,.02,.287,.298,.278,.773-.02,1.061L3.271,16.29c-.146,.14-.333,.21-.521,.21Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default volumeOff;

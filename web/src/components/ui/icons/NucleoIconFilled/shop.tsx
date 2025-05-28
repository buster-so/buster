import React from 'react';

import type { iconProps } from './iconProps';

function shop(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shop';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.476,7.75c.82,0,1.613-.275,2.263-.773,1.297,.993,3.226,.996,4.522,0,.648,.497,1.44,.772,2.261,.772,1.454,0,2.789-.858,3.401-2.187,.101-.219,.09-.474-.029-.684l-1.704-2.997c-.312-.544-.895-.883-1.521-.883H4.331c-.626,0-1.208,.338-1.521,.884l-1.706,2.995c-.12,.21-.131,.465-.03,.685,.612,1.328,1.947,2.187,3.401,2.187Z"
          fill="currentColor"
        />
        <path
          d="M16.25,15.5h-1.25v-6c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6h-2.5v-2.5c0-1.104-.895-2-2-2s-2,.896-2,2v2.5h-2.5v-6c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shop;

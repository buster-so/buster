import React from 'react';

import type { iconProps } from './iconProps';

function orientationLandscape(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px orientation landscape';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.28,6.22l-2-2c-.293-.293-.768-.293-1.061,0L.22,6.22c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l.72-.72v6.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V6.561l.72,.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2h-5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-4.163,9.391c-.487,.27-1.087-.118-1.087-.675v-3.431c0-.557,.6-.945,1.087-.676,.842,.467,1.413,1.359,1.413,2.391s-.571,1.925-1.413,2.391Zm3.663-1.141c-.69,0-1.25-.56-1.25-1.25s.56-1.25,1.25-1.25,1.25,.56,1.25,1.25-.56,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default orientationLandscape;

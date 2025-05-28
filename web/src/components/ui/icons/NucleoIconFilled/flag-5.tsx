import React from 'react';

import type { iconProps } from './iconProps';

function flag5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.635,2.606c-.227-.136-.508-.142-.74-.017-1.281,.689-2.481,.958-3.565,.794-.495-.074-.86-.219-1.284-.387-.47-.187-1.002-.398-1.781-.546-1.059-.201-2.155-.194-3.265-.002V10.956c1.019-.213,2.029-.247,3.007-.091,.628,.1,1.043,.244,1.483,.396,.416,.144,.846,.292,1.422,.388,.362,.06,.73,.09,1.104,.09,1.092,0,2.237-.255,3.417-.762,.326-.082,.566-.377,.566-.728V3.25c0-.264-.139-.508-.365-.644Z"
          fill="currentColor"
        />
        <path
          d="M3.75,17c-.414,0-.75-.336-.75-.75V1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v14.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flag5;

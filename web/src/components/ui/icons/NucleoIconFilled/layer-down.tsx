import React from 'react';

import type { iconProps } from './iconProps';

function layerDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layer down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.685,6.298l-5.869-3.09c-.511-.27-1.121-.271-1.632,0L2.313,6.298c-.494,.26-.801,.769-.801,1.327s.307,1.067,.801,1.327l4.437,2.336v-3.289c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v3.288l4.435-2.335c.494-.26,.801-.769,.801-1.327s-.307-1.067-.801-1.327Z"
          fill="currentColor"
        />
        <path
          d="M12.03,13.22c-.293-.293-.768-.293-1.061,0l-1.22,1.22v-6.439c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.439l-1.22-1.22c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default layerDown;

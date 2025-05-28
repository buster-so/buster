import React from 'react';

import type { iconProps } from './iconProps';

function layerBack(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layer back';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.75,11.343l-3.738-1.968c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,.558,.307,1.066,.801,1.328l4.437,2.336v-1.695Z"
          fill="currentColor"
        />
        <path
          d="M15.736,8.625c-.415,0-.75,.336-.75,.75l-3.735,1.967v1.695l4.436-2.335c.494-.261,.8-.77,.8-1.327,0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.687,4.797L9.817,1.707c-.511-.27-1.121-.271-1.632,0L2.315,4.797c-.494,.26-.801,.769-.801,1.327s.307,1.067,.801,1.327l4.435,2.335v-3.537c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v3.538l4.437-2.336c.494-.26,.801-.769,.801-1.327s-.307-1.067-.801-1.327Z"
          fill="currentColor"
        />
        <path
          d="M11.78,14.47c-.293-.293-.768-.293-1.061,0l-.97,.97V6.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V15.439l-.97-.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default layerBack;

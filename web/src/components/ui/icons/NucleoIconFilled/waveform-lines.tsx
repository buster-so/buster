import React from 'react';

import type { iconProps } from './iconProps';

function waveformLines(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px waveform lines';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M1.25,10.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,10.5c-.414,0-.75-.336-.75-.75v-1.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4.25,15c-.414,0-.75-.336-.75-.75V3.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V14.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7.25,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M10.25,16c-.414,0-.75-.336-.75-.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,13c-.414,0-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default waveformLines;

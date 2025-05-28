import React from 'react';

import type { iconProps } from './iconProps';

function trafficCone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px traffic cone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.939,12h6.121l.7,2.5h1.559L11.177,3.28c-.21-.753-.902-1.28-1.686-1.28h-.982c-.783,0-1.476,.526-1.686,1.278L3.681,14.5h1.558l.7-2.5ZM8.269,3.681c.029-.106,.129-.181,.24-.181h.982c.111,0,.211,.075,.24,.183l.929,3.317h-3.321l.929-3.319Z"
          fill="currentColor"
        />
        <path
          d="M15.25,16H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default trafficCone;

import React from 'react';

import type { iconProps } from './iconProps';

function tableColNewLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table col new left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H5c-1.146,0-2.151,.694-2.563,1.768-.148,.387,.045,.82,.432,.969,.386,.149,.82-.045,.969-.432,.188-.489,.644-.805,1.163-.805h4V14.5H5c-.519,0-.976-.316-1.163-.805-.148-.387-.583-.581-.969-.432-.387,.148-.58,.582-.432,.969,.412,1.074,1.418,1.768,2.563,1.768H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M2.5,11.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColNewLeft;

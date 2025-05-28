import React from 'react';

import type { iconProps } from './iconProps';

function suitcaseCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.5,14.875c0-1.748,1.244-3.21,2.894-3.55,.839-1.131,2.175-1.825,3.606-1.825,.722,0,1.395,.187,2,.49v-3.24c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h4.947c-.117-.356-.197-.73-.197-1.125Z"
          fill="currentColor"
        />
        <path
          d="M15,11c-1.186,0-2.241,.714-2.72,1.756-1.2-.09-2.28,.896-2.28,2.119,0,1.172,.953,2.125,2.125,2.125h2.875c1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcaseCloud;

import React from 'react';

import type { iconProps } from './iconProps';

function mirrorObjYDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mirror obj y dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,13.248v-1.5c0-.414-.336-.75-.75-.75H2.75c-.414,0-.75,.336-.75,.75v1.5c0,1.519,1.231,2.75,2.75,2.75H13.25c1.519,0,2.75-1.231,2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M2,6.248v-1.5c0-1.517,1.233-2.75,2.75-2.75H13.25c1.517,0,2.75,1.233,2.75,2.75v1.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.5c0-.689-.561-1.25-1.25-1.25H4.75c-.689,0-1.25,.561-1.25,1.25v1.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="15.25" cy="8.998" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="8.998" fill="currentColor" r=".75" />
        <circle cx="9" cy="8.998" fill="currentColor" r=".75" />
        <circle cx="5.875" cy="8.998" fill="currentColor" r=".75" />
        <circle cx="2.75" cy="8.998" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default mirrorObjYDotted;

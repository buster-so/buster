import React from 'react';

import type { iconProps } from './iconProps';

function award2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px award 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,13.5c-1.478,0-2.853-.447-4-1.209v4.459c0,.286,.162,.547,.419,.673,.254,.126,.561,.097,.788-.079l2.793-2.148,2.793,2.148c.134,.103,.295,.156,.457,.156,.113,0,.227-.025,.331-.077,.257-.126,.419-.387,.419-.673v-4.459c-1.147,.762-2.522,1.209-4,1.209Z"
          fill="currentColor"
        />
        <circle cx="9" cy="6.25" fill="currentColor" r="5.75" />
      </g>
    </svg>
  );
}

export default award2;

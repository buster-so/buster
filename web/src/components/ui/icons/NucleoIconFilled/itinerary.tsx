import React from 'react';

import type { iconProps } from './iconProps';

function itinerary(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px itinerary';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="5.5" width="5.5" fill="currentColor" rx="1.75" ry="1.75" x="2" y="1.5" />
        <rect height="5.5" width="5.5" fill="currentColor" rx="1.75" ry="1.75" x="10.5" y="11" />
        <path
          d="M12.875,3.5h-3.375c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.375c.896,0,1.625,.729,1.625,1.625s-.729,1.625-1.625,1.625H5.125c-1.723,0-3.125,1.402-3.125,3.125s1.402,3.125,3.125,3.125h3.375c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-3.375c-.896,0-1.625-.729-1.625-1.625s.729-1.625,1.625-1.625h7.75c1.723,0,3.125-1.402,3.125-3.125s-1.402-3.125-3.125-3.125Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default itinerary;

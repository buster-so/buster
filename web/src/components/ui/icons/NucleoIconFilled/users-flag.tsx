import React from 'react';

import type { iconProps } from './iconProps';

function usersFlag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M9.5,11.25c0-.634,.224-1.211,.586-1.677-.922-.525-1.976-.823-3.086-.823-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,.843,0,1.677-.091,2.5-.251v-4.499Z"
          fill="currentColor"
        />
        <path
          d="M15.75,10h-3.5c-.689,0-1.25,.561-1.25,1.25v6c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75h3.25c.689,0,1.25-.561,1.25-1.25v-2c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
        />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersFlag;

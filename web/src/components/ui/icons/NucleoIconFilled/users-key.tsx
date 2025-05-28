import React from 'react';

import type { iconProps } from './iconProps';

function usersKey(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users key';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M8,13.75c0-1.77,1.236-3.248,2.887-3.64-1.083-.864-2.44-1.36-3.887-1.36-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,.561,0,1.118-.047,1.671-.119-.421-.606-.671-1.339-.671-2.131Z"
          fill="currentColor"
        />
        <path
          d="M16.75,13h-2.888c-.311-.871-1.135-1.5-2.112-1.5-1.241,0-2.25,1.009-2.25,2.25s1.009,2.25,2.25,2.25c.976,0,1.801-.629,2.112-1.5h1.138v.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.5h.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Zm-5,1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersKey;

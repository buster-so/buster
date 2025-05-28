import React from 'react';

import type { iconProps } from './iconProps';

function userList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6.807" cy="5" fill="currentColor" r="3" />
        <path
          d="M6.807,9c-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.385,.48,2.827,.724,4.286,.724s2.902-.244,4.286-.724c.618-.214,1.113-.686,1.359-1.293,.238-.588,.212-1.244-.069-1.801-1.07-2.117-3.207-3.432-5.576-3.432Z"
          fill="currentColor"
        />
        <path
          d="M11.75,4h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,6h-4.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,9.5h-2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userList;

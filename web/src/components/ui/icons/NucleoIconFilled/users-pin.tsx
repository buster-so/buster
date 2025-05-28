import React from 'react';

import type { iconProps } from './iconProps';

function usersPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M9,12.75c0-1.198,.441-2.284,1.146-3.146-.936-.546-2.012-.854-3.146-.854-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,.977,0,1.943-.119,2.891-.335-.516-.812-.891-1.786-.891-2.915Z"
          fill="currentColor"
        />
        <path
          d="M14,9.25c-1.93,0-3.5,1.57-3.5,3.5,0,2.655,3.011,4.337,3.139,4.408,.112,.062,.237,.092,.361,.092s.249-.031,.361-.092c.128-.07,3.139-1.753,3.139-4.408,0-1.93-1.57-3.5-3.5-3.5Zm0,4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersPin;

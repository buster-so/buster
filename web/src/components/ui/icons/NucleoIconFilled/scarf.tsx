import React from 'react';

import type { iconProps } from './iconProps';

function scarf(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px scarf';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.5,4.025v7.449c.846-.123,1.5-.845,1.5-1.725V5.75c0-.879-.654-1.602-1.5-1.725Z"
          fill="currentColor"
        />
        <path
          d="M5,4H2.75c-.965,0-1.75,.785-1.75,1.75v4c0,.965,.785,1.75,1.75,1.75h2.25V4Z"
          fill="currentColor"
        />
        <path
          d="M12.25,2h-4c-.965,0-1.75,.785-1.75,1.75V15.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h1.5v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h1.5v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default scarf;

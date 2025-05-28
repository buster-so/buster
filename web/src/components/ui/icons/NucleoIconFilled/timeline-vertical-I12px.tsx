import React from 'react';

import type { iconProps } from './iconProps';

function timelineVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px timeline vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x="12.5" y="2" />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x="12.5" y="11" />
        <rect height="5" width="5" fill="currentColor" rx="1.75" ry="1.75" x=".5" y="6" />
        <path
          d="M9.75,5.5h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V7.5h-1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1v7.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1V5.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default timelineVertical;

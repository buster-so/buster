import React from 'react';

import type { iconProps } from './iconProps';

function timelineVertical2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px timeline vertical 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,9c0-1.115-.739-2.052-1.75-2.372V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V6.628c-1.011,.321-1.75,1.257-1.75,2.372s.739,2.052,1.75,2.372v4.878c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-4.878c1.011-.321,1.75-1.257,1.75-2.372Zm-2.5,1c-.552,0-1-.449-1-1s.448-1,1-1,1,.449,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <rect height="6.5" width="10" fill="currentColor" rx="1.75" ry="1.75" x="7" y="1.5" />
        <rect height="6.5" width="10" fill="currentColor" rx="1.75" ry="1.75" x="7" y="10" />
      </g>
    </svg>
  );
}

export default timelineVertical2;

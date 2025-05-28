import React from 'react';

import type { iconProps } from './iconProps';

function slidersVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sliders vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.5.75v10.5c0,.414-.336.75-.75.75s-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4,.75v10.5c0,.414-.336.75-.75.75s-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="8.75" cy="7.5" fill="currentColor" r="2.5" strokeWidth="0" />
        <circle cx="3.25" cy="4.5" fill="currentColor" r="2.5" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default slidersVertical;

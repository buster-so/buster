import React from 'react';

import type { iconProps } from './iconProps';

function axisDottedY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis dotted y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.755,3.707l-2.475-2.475c-.293-.293-.768-.293-1.061,0l-2.475,2.475c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.194-1.194v7.177c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.573l1.194,1.194c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <circle cx="16.75" cy="10.75" fill="currentColor" r=".75" />
        <circle cx="1.75" cy="16.75" fill="currentColor" r=".75" />
        <circle cx="13.75" cy="10.75" fill="currentColor" r=".75" />
        <circle cx="10.75" cy="10.75" fill="currentColor" r=".75" />
        <circle cx="3.75" cy="14.75" fill="currentColor" r=".75" />
        <circle cx="5.75" cy="12.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default axisDottedY;

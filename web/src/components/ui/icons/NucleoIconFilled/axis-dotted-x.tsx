import React from 'react';

import type { iconProps } from './iconProps';

function axisDottedX(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis dotted x';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.768,10.22l-2.475-2.475c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.195,1.195H7.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.177l-1.195,1.195c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.475-2.475c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M6.75,2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.75,5.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.75,8.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75-.75,.336-.75,.75,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <circle cx="1.25" cy="16.75" fill="currentColor" r=".75" />
        <circle cx="3.25" cy="14.75" fill="currentColor" r=".75" />
        <circle cx="5.25" cy="12.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default axisDottedX;

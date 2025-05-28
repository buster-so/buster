import React from 'react';

import type { iconProps } from './iconProps';

function sortObjTopToBottom(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort obj top to bottom';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="6.5" width="6.5" fill="currentColor" rx="2.25" ry="2.25" x="10.5" y="10" />
        <path
          d="M14.75,1.5h-2c-1.241,0-2.25,1.009-2.25,2.25v2c0,1.241,1.009,2.25,2.25,2.25h2c1.241,0,2.25-1.009,2.25-2.25V3.75c0-1.241-1.009-2.25-2.25-2.25Zm.75,4.25c0,.414-.336,.75-.75,.75h-2c-.414,0-.75-.336-.75-.75V3.75c0-.414,.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75v2Z"
          fill="currentColor"
        />
        <path
          d="M7.28,10.97c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.97,.97h-.689c-2.206,0-4-1.794-4-4s1.794-4,4-4h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1.75C3.467,3.5,1,5.967,1,9s2.467,5.5,5.5,5.5h.689l-.97,.97c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.25-2.25c.293-.293,.293-.768,0-1.061l-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortObjTopToBottom;

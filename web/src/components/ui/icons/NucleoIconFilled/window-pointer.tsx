import React from 'react';

import type { iconProps } from './iconProps';

function windowPointer(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window pointer';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.862c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v1.978c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM4,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M17.324,12.233l-5.94-2.17h0c-.379-.139-.795-.047-1.082,.24-.286,.287-.377,.702-.237,1.081l2.17,5.941c.149,.406,.536,.675,.967,.675h.022c.439-.01,.825-.297,.958-.716l.753-2.351,2.352-.752c.419-.134,.706-.52,.715-.96s-.264-.837-.676-.988Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default windowPointer;

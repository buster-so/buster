import React from 'react';

import type { iconProps } from './iconProps';

function windowBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v.396c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.646c0-1.517-1.233-2.75-2.75-2.75ZM4,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M15.25,10h-2.5c-.965,0-1.75,.785-1.75,1.75v5.5c0,.303,.183,.577,.463,.693,.28,.117,.603,.052,.817-.163l1.72-1.72,1.72,1.72c.144,.144,.335,.22,.53,.22,.097,0,.194-.019,.287-.057,.28-.116,.463-.39,.463-.693v-5.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default windowBookmark;

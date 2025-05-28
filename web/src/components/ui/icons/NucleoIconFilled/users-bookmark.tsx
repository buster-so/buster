import React from 'react';

import type { iconProps } from './iconProps';

function usersBookmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users bookmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12,1.75c-.5,0-.965,.135-1.38,.352,.547,.745,.88,1.655,.88,2.648s-.333,1.903-.88,2.648c.415,.217,.88,.352,1.38,.352,1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
        <path
          d="M9.5,11.75c0-.794,.298-1.514,.773-2.079-.964-.593-2.089-.921-3.273-.921-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.384,.48,2.826,.724,4.286,.724,.843,0,1.677-.091,2.5-.251v-3.999Z"
          fill="currentColor"
        />
        <path
          d="M15.25,10h-2.5c-.965,0-1.75,.785-1.75,1.75v5.5c0,.303,.183,.577,.463,.693,.279,.117,.603,.052,.817-.163l1.72-1.72,1.72,1.72c.144,.144,.335,.22,.53,.22,.097,0,.194-.019,.287-.057,.28-.116,.463-.39,.463-.693v-5.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <circle cx="7" cy="4.75" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default usersBookmark;

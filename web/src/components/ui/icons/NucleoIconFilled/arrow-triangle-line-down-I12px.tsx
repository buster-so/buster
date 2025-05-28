import React from 'react';

import type { iconProps } from './iconProps';

function arrowTriangleLineDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow triangle line down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,11c-.414,0-.75-.336-.75-.75V2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V10.25c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.058,9.5H5.942c-.463,0-.887,.254-1.104,.664-.217,.409-.191,.902,.069,1.287l3.058,4.517c.233,.344,.62,.549,1.035,.549s.802-.206,1.035-.549l3.058-4.517c.26-.384,.286-.877,.069-1.287-.217-.41-.641-.664-1.104-.664Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowTriangleLineDown;

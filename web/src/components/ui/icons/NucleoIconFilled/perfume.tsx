import React from 'react';

import type { iconProps } from './iconProps';

function perfume(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px perfume';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.25" cy="3.75" fill="currentColor" r=".75" />
        <circle cx="16.75" cy="2.25" fill="currentColor" r=".75" />
        <circle cx="16.75" cy="5.25" fill="currentColor" r=".75" />
        <path
          d="M10.25,1h-1.5c-.965,0-1.75,.785-1.75,1.75v.621c-2.677,.774-4.855,2.73-5.884,5.355-.151,.385,.039,.821,.425,.972,.09,.035,.182,.052,.273,.052,.299,0,.583-.181,.698-.477,.805-2.052,2.446-3.625,4.487-4.345v2.041c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.138,.112-.25,.25-.25h1.5c.138,0,.25,.112,.25,.25V6.969c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M15.41,11c-.478-2.833-2.942-5-5.91-5s-5.431,2.167-5.91,5H15.41Z"
          fill="currentColor"
        />
        <path
          d="M3.53,12.5c.148,1.725,1.042,3.328,2.47,4.358,.128,.092,.281,.142,.439,.142h6.121c.158,0,.311-.05,.439-.142,1.428-1.031,2.322-2.633,2.47-4.358H3.53Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default perfume;

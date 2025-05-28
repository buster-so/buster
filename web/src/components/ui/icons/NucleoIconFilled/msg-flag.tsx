import React from 'react';

import type { iconProps } from './iconProps';

function msgFlag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px msg flag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.5,11.25c0-1.517,1.233-2.75,2.75-2.75h3.5c.077,0,.15,.017,.226,.023-.249-4.189-3.726-7.523-7.976-7.523C4.589,1,1,4.589,1,9c0,1.397,.371,2.778,1.062,3.971,.238,.446-.095,2.002-.842,2.749-.209,.209-.276,.522-.17,.798,.105,.276,.364,.465,.659,.481,.079,.004,.16,.006,.242,.006,1.145,0,2.534-.407,3.44-.871,.675,.343,1.39,.587,2.131,.727,.484,.092,.981,.138,1.478,.138,.513,0,1.013-.053,1.5-.146v-5.604Z"
          fill="currentColor"
        />
        <path
          d="M16.75,10h-3.5c-.689,0-1.25,.561-1.25,1.25v6c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.75h3.25c.689,0,1.25-.561,1.25-1.25v-2c0-.689-.561-1.25-1.25-1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default msgFlag;

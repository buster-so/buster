import React from 'react';

import type { iconProps } from './iconProps';

function users4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.39,12.481c-.472-2.162-2.424-3.731-4.64-3.731-.974,0-1.887,.316-2.655,.839,.599,.737,1.049,1.604,1.261,2.572,.21,.957-.058,1.92-.638,2.654,.67,.118,1.349,.184,2.033,.184,1.158,0,2.308-.17,3.416-.506,.876-.265,1.413-1.149,1.224-2.013Z"
          fill="currentColor"
        />
        <path
          d="M9.89,12.481c-.472-2.162-2.424-3.731-4.64-3.731S1.082,10.319,.61,12.481c-.189,.864,.348,1.749,1.224,2.013,1.108,.335,2.258,.506,3.416,.506s2.308-.17,3.416-.506c.876-.265,1.413-1.149,1.224-2.013Z"
          fill="currentColor"
        />
        <circle cx="5.25" cy="5" fill="currentColor" r="2.75" />
        <circle cx="12.75" cy="5" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default users4;

import React from 'react';

import type { iconProps } from './iconProps';

function connectedDots2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connected dots 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.046,12.261c-.118,0-.237-.028-.349-.086-.367-.193-.507-.646-.314-1.013l2.907-5.523c.193-.368,.646-.506,1.013-.314,.367,.193,.507,.646,.314,1.013l-2.907,5.523c-.134,.255-.395,.401-.664,.401Z"
          fill="currentColor"
        />
        <path
          d="M12.954,12.261c-.27,0-.53-.146-.664-.401l-2.907-5.523c-.193-.366-.052-.82,.314-1.013,.365-.194,.819-.053,1.013,.314l2.907,5.523c.193,.366,.052,.82-.314,1.013-.111,.059-.231,.086-.349,.086Z"
          fill="currentColor"
        />
        <path
          d="M11.75,14H6.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="9" cy="4" fill="currentColor" r="3" />
        <circle cx="14" cy="13.5" fill="currentColor" r="3" />
        <circle cx="4" cy="13.5" fill="currentColor" r="3" />
      </g>
    </svg>
  );
}

export default connectedDots2;

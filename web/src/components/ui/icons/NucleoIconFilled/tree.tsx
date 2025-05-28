import React from 'react';

import type { iconProps } from './iconProps';

function tree(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tree';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.354,12.806l-2.799-3.806h1.194c.282,0,.541-.159,.669-.411,.128-.251,.104-.554-.063-.782L9.605,1.308c-.283-.387-.928-.387-1.211,0L3.645,7.808c-.167,.228-.191,.53-.063,.782,.128,.252,.387,.411,.669,.411h1.194l-2.799,3.806c-.167,.228-.192,.531-.064,.783,.127,.252,.386,.412,.669,.412h5v2.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.25h5c.283,0,.542-.159,.669-.412,.128-.252,.103-.555-.064-.783Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tree;

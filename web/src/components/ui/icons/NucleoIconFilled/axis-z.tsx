import React from 'react';

import type { iconProps } from './iconProps';

function axisZ(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px axis z';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,10H8V1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V10.439L1.47,15.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l5.03-5.03h8.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M5.25,17H1.75c-.414,0-.75-.336-.75-.75v-3.5c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75h2.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default axisZ;

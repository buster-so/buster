import React from 'react';

import type { iconProps } from './iconProps';

function layerUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layer up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.687,9.047l-4.437-2.336v3.289c0,1.241-1.009,2.25-2.25,2.25s-2.25-1.009-2.25-2.25v-3.288l-4.435,2.335c-.494,.26-.801,.769-.801,1.327s.307,1.067,.801,1.327l5.869,3.09c.256,.135,.536,.203,.817,.203s.56-.067,.815-.202l5.87-3.091c.494-.26,.801-.769,.801-1.327s-.307-1.067-.801-1.327Z"
          fill="currentColor"
        />
        <path
          d="M12.03,3.72l-2.5-2.5c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.22-1.22v6.439c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.561l1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default layerUp;

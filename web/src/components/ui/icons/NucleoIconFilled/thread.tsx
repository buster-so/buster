import React from 'react';

import type { iconProps } from './iconProps';

function thread(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px thread';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4,5.212v2.194l10.115-2.38,1.07-1.74c.285-.462,.297-1.043,.032-1.518s-.767-.769-1.31-.769H4.092c-.543,0-1.045,.294-1.31,.769s-.252,1.056,.032,1.518l1.185,1.926Z"
          fill="currentColor"
        />
        <path d="M14 6.594L4 8.947 4 11.406 14 9.053 14 6.594z" fill="currentColor" />
        <path
          d="M15.261,11.839c1.745-.411,2.83-2.164,2.419-3.908-.095-.403-.498-.654-.902-.558-.403,.095-.653,.499-.558,.902,.221,.939-.363,1.883-1.303,2.104L3.885,12.974l-1.071,1.74c-.285,.462-.297,1.043-.032,1.518s.767,.769,1.31,.769H13.908c.543,0,1.045-.294,1.31-.769s.252-1.056-.032-1.518l-1.185-1.926v-.651l1.261-.297Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default thread;

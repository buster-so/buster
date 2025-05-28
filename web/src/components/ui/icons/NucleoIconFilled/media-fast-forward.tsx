import React from 'react';

import type { iconProps } from './iconProps';

function mediaFastForward(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media fast forward';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.355,7.906L9.855,3.75c-.391-.216-.855-.21-1.239,.017-.386,.227-.616,.63-.616,1.077v2.311L1.855,3.751c-.392-.217-.855-.21-1.24,.016-.386,.227-.616,.63-.616,1.077V13.156c0,.447,.23,.85,.616,1.077,.197,.116,.416,.175,.634,.175,.208,0,.415-.053,.605-.158l6.145-3.405v2.311c0,.447,.23,.85,.616,1.077,.197,.116,.416,.175,.634,.175,.208,0,.415-.053,.605-.158l7.5-4.156c.397-.22,.645-.639,.645-1.094s-.247-.874-.645-1.094Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mediaFastForward;

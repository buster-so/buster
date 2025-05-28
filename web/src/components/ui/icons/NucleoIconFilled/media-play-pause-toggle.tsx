import React from 'react';

import type { iconProps } from './iconProps';

function mediaPlayPauseToggle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media play pause toggle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.355,7.906L1.855,3.751c-.391-.217-.854-.21-1.24,.016-.385,.227-.615,.63-.615,1.077V13.156c0,.447,.23,.85,.615,1.077,.198,.116,.416,.175,.635,.175,.207,0,.415-.053,.605-.158l7.5-4.156c.397-.22,.645-.639,.645-1.094s-.247-.874-.645-1.094Z"
          fill="currentColor"
        />
        <path
          d="M17.25,3c-.414,0-.75,.336-.75,.75V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3c-.414,0-.75,.336-.75,.75V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mediaPlayPauseToggle;

import React from 'react';

import type { iconProps } from './iconProps';

function playRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px play rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.749,12.379c.218,0,.436-.057.63-.17l3.65-2.128c.389-.226.621-.629.621-1.079,0-.45-.231-.854-.62-1.081h0l-3.651-2.129c-.385-.225-.865-.228-1.252-.005-.387.223-.627.638-.627,1.084v4.259c0,.446.24.861.627,1.084.192.11.408.165.623.165Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9,1C4.589,1,1,4.589,1,9c0,.414.336.75.75.75s.75-.336.75-.75c0-3.584,2.916-6.5,6.5-6.5s6.5,2.916,6.5,6.5-2.916,6.5-6.5,6.5c-2.165,0-4.143-1.056-5.347-2.804l1.477.204c.409.058.789-.23.846-.641.057-.41-.23-.789-.641-.846l-2.944-.407c-.409-.057-.789.229-.845.641l-.408,2.945c-.057.41.229.788.64.846.035.005.07.007.104.007.369,0,.69-.271.742-.647l.117-.843c1.499,1.9,3.773,3.045,6.26,3.045,4.411,0,8-3.589,8-8S13.411,1,9,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default playRotateClockwise;

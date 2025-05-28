import React from 'react';

import type { iconProps } from './iconProps';

function flower(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flower';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m17,9c0-1.009-.903-1.85-2.421-2.311.747-1.4.792-2.633.079-3.346s-1.945-.67-3.347.078c-.461-1.518-1.302-2.421-2.311-2.421s-1.85.903-2.311,2.421c-1.4-.748-2.634-.791-3.346-.079s-.669,1.947.078,3.347c-1.518.461-2.421,1.302-2.421,2.311s.903,1.85,2.421,2.311c-.747,1.4-.792,2.633-.079,3.346.712.712,1.944.669,3.347-.078.461,1.518,1.302,2.421,2.311,2.421s1.85-.903,2.311-2.421c1.4.748,2.634.791,3.346.079s.669-1.947-.078-3.347c1.518-.461,2.421-1.302,2.421-2.311Zm-8,2.5c-1.3813,0-2.5-1.12-2.5-2.5s1.1187-2.5,2.5-2.5,2.5,1.12,2.5,2.5-1.1188,2.5-2.5,2.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default flower;

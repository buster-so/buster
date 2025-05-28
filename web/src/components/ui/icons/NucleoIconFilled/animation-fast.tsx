import React from 'react';

import type { iconProps } from './iconProps';

function animationFast(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px animation fast';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.828,15.17c-.704,0-1.408-.268-1.944-.804l-3.421-3.422c-.52-.519-.806-1.209-.806-1.944s.286-1.425,.806-1.944l3.421-3.422c1.072-1.071,2.817-1.072,3.889,0h0l3.421,3.422c.52,.519,.806,1.209,.806,1.944s-.286,1.425-.806,1.944l-3.421,3.422c-.536,.536-1.24,.804-1.945,.804Z"
          fill="currentColor"
        />
        <path
          d="M4,9.75H.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.25,6.5H3.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.25,13H3.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default animationFast;

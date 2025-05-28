import React from 'react';

import type { iconProps } from './iconProps';

function cloudFog(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud fog';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.25,14H1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H11.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.25,17h-5.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,14h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M5.75,17H3.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.146,5.327c-.442-2.463-2.611-4.327-5.146-4.327C6.105,1,3.75,3.355,3.75,6.25c0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,.414,.335,.75,.75,.75l14.423,.009h0c.356,0,.663-.25,.735-.599,.061-.297,.092-.604,.092-.91,0-1.854-1.15-3.503-2.854-4.173Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudFog;

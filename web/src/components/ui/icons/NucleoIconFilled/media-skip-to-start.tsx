import React from 'react';

import type { iconProps } from './iconProps';

function mediaSkipToStart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media skip to start';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.364,4.285c-.391-.22-.868-.213-1.252,.019l-5.112,3.086v-2.012c0-.452-.243-.871-.636-1.092-.391-.22-.868-.213-1.252,.019L3.102,7.932c-.377,.228-.602,.626-.602,1.066s.227,.843,.605,1.073l6.003,3.623c.198,.119,.421,.179,.645,.179,.211,0,.422-.053,.612-.161,.392-.221,.635-.638,.635-1.089v-2.012l5.108,3.083c.198,.119,.421,.179,.645,.179,.211,0,.422-.053,.612-.161,.392-.221,.635-.638,.635-1.089V5.377c0-.452-.243-.871-.636-1.092Z"
          fill="currentColor"
        />
        <path
          d="M.75,3.5c-.414,0-.75,.336-.75,.75V13.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.25c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mediaSkipToStart;

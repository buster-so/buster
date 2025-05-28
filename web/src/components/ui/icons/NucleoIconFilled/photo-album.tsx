import React from 'react';

import type { iconProps } from './iconProps';

function photoAlbum(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px photo album';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.194,8.384c-1.038-1.039-2.851-1.039-3.889,0L3.067,14.623c.214,.078,.442,.127,.683,.127H14.25c1.105,0,2-.896,2-2v-1.311l-3.056-3.056Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2.5h-.75V1.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1h-2.25V1.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1h-2.25V1.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1h-.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.25c0-1.517-1.233-2.75-2.75-2.75Zm1.25,10.25c0,.689-.561,1.25-1.25,1.25H3.75c-.689,0-1.25-.561-1.25-1.25V5.25c0-.689,.561-1.25,1.25-1.25H14.25c.689,0,1.25,.561,1.25,1.25v7.5Z"
          fill="currentColor"
        />
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default photoAlbum;

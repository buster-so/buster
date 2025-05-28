import React from 'react';

import type { iconProps } from './iconProps';

function stillRings(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px still rings';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.5,7.076V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V7.076c-2.124,.36-3.75,2.2-3.75,4.424,0,2.481,2.019,4.5,4.5,4.5s4.5-2.019,4.5-4.5c0-2.225-1.626-4.064-3.75-4.424Zm-.75,7.424c-1.654,0-3-1.346-3-3s1.346-3,3-3,3,1.346,3,3-1.346,3-3,3Z"
          fill="currentColor"
        />
        <path
          d="M13,7.076V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75V7.063c-.255,.043-.506,.106-.75,.193-.391,.138-.595,.567-.457,.957,.138,.391,.566,.595,.957,.457,.32-.113,.656-.17,1-.17,1.654,0,3,1.346,3,3s-1.346,3-3,3c-.344,0-.68-.057-1-.17-.391-.138-.819,.066-.957,.457-.138,.39,.066,.819,.457,.957,.48,.17,.985,.256,1.5,.256,2.481,0,4.5-2.019,4.5-4.5,0-2.225-1.626-4.064-3.75-4.424Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default stillRings;

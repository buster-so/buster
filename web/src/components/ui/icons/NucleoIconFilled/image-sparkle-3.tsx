import React from 'react';

import type { iconProps } from './iconProps';

function imageSparkle3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image sparkle 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.194,8.384c-1.038-1.039-2.851-1.039-3.889,0L3.067,14.623c.214,.078,.442,.127,.683,.127H14.25c1.105,0,2-.896,2-2v-1.311l-3.056-3.056Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15.5H3.75c-1.517,0-2.75-1.233-2.75-2.75V5.25c0-1.517,1.233-2.75,2.75-2.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.75c-.689,0-1.25,.561-1.25,1.25v7.5c0,.689,.561,1.25,1.25,1.25H14.25c.689,0,1.25-.561,1.25-1.25v-4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.25c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.526,3.053l-1.848-.731-.731-1.848c-.226-.572-1.169-.572-1.395,0l-.731,1.848-1.848,.731c-.286,.113-.474,.39-.474,.697s.188,.584,.474,.697l1.848,.731,.731,1.848c.113,.286,.39,.474,.697,.474s.584-.188,.697-.474l.731-1.848,1.848-.731c.286-.113,.474-.39,.474-.697s-.188-.584-.474-.697Z"
          fill="currentColor"
        />
        <circle cx="5.75" cy="7.25" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default imageSparkle3;

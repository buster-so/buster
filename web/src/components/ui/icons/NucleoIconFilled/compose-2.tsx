import React from 'react';

import type { iconProps } from './iconProps';

function compose2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compose 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,8c-.414,0-.75,.336-.75,.75v4.5c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-4.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.366,1.634c-.723-.723-1.984-.723-2.707,0l-6.699,6.699c-.646,.646-.877,2.058-.956,2.841-.022,.224,.057,.447,.216,.606,.142,.142,.332,.22,.53,.22,.025,0,.051-.001,.075-.004,.784-.08,2.195-.309,2.842-.956l6.7-6.7c.744-.746,.744-1.96,0-2.707Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default compose2;

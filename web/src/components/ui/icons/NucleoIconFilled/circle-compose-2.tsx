import React from 'react';

import type { iconProps } from './iconProps';

function circleCompose2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle compose 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.925,7.898c-.057-.411-.429-.69-.846-.641-.41,.057-.697,.435-.641,.845,.041,.296,.062,.598,.062,.898,0,3.584-2.916,6.5-6.5,6.5s-6.5-2.916-6.5-6.5S5.416,2.5,9,2.5c.299,0,.602,.021,.898,.062,.402,.053,.788-.23,.845-.641,.057-.41-.23-.789-.642-.845-.363-.05-.734-.075-1.102-.075C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8c0-.368-.025-.739-.075-1.102Z"
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

export default circleCompose2;

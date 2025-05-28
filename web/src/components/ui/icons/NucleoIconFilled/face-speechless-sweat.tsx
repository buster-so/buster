import React from 'react';

import type { iconProps } from './iconProps';

function faceSpeechlessSweat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face speechless sweat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.708,6.887c-.308,.082-.625,.14-.958,.14-2.068,0-3.75-1.685-3.75-3.755,0-.542,.131-1.058,.327-1.537-1.015-.467-2.139-.734-3.327-.734C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8c0-.732-.107-1.439-.292-2.113Zm-6.458,6.113h-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm2.75-4h-.153c.089,.149,.153,.314,.153,.5,0,.552-.448,1-1,1s-1-.448-1-1c0-.186,.065-.351,.153-.5H6.847c.089,.149,.153,.314,.153,.5,0,.552-.448,1-1,1s-1-.448-1-1c0-.186,.065-.351,.153-.5h-.153c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,5.526c-1.241,0-2.25-1.012-2.25-2.255,0-1.476,1.644-2.951,1.831-3.114,.24-.209,.598-.209,.838,0,.187,.163,1.831,1.638,1.831,3.114,0,1.243-1.009,2.255-2.25,2.255Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default faceSpeechlessSweat;

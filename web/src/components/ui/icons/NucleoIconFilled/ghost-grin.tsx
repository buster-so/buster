import React from 'react';

import type { iconProps } from './iconProps';

function ghostGrin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ghost grin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1c-3.86,0-7,3.14-7,7v8.25c0,.414,.336,.75,.75,.75,1.205,0,1.833-.576,2.292-.997,.38-.349,.565-.503,.958-.503,.416,0,.617,.177,.996,.544,.416,.403,.985,.956,2.004,.956s1.588-.552,2.004-.956c.379-.368,.58-.544,.996-.544,.394,0,.579,.154,.958,.503,.458,.42,1.086,.997,2.292,.997,.414,0,.75-.336,.75-.75V8c0-3.86-3.14-7-7-7Zm-3,9c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,2c-.828,0-1.5-.672-1.5-1.5,0-.276,.224-.5,.5-.5h2c.276,0,.5,.224,.5,.5,0,.828-.672,1.5-1.5,1.5Zm3-2c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default ghostGrin;

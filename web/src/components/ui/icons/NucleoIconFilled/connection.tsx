import React from 'react';

import type { iconProps } from './iconProps';

function connection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px connection';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8c0,2.69-1.34,5.185-3.585,6.672-.345,.227-.811,.134-1.04-.21-.229-.345-.135-.811,.21-1.04,1.825-1.209,2.914-3.236,2.914-5.422,0-3.584-2.916-6.5-6.5-6.5S2.5,5.416,2.5,9c0,3.331,2.518,6.084,5.75,6.457v-2.354c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.146c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.957,7h-.439v-1.45c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.45h-2.035v-1.45c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.45h-.439c-.965,0-1.75,.785-1.75,1.75v.396c0,2.596,2.111,4.707,4.707,4.707s4.707-2.111,4.707-4.707v-.396c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default connection;

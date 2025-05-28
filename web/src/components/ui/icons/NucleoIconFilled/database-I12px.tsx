import React from 'react';

import type { iconProps } from './iconProps';

function database(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px database';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1.25c-3.479,0-7,1.03-7,3V13.75c0,1.97,3.521,3,7,3s7-1.03,7-3V4.25c0-1.97-3.521-3-7-3Zm5.5,7.75c0,.436-1.927,1.5-5.5,1.5s-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079s4.151-.368,5.5-1.079v2.829Zm-5.5,6.25c-3.573,0-5.5-1.064-5.5-1.5v-2.829c1.349,.711,3.429,1.079,5.5,1.079s4.151-.368,5.5-1.079v2.829c0,.436-1.927,1.5-5.5,1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default database;

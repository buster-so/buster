import React from 'react';

import type { iconProps } from './iconProps';

function flame(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flame';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.493,1.185c-.282-.246-.703-.246-.985,0-.235,.205-5.757,5.067-5.757,9.548,0,3.456,2.804,6.267,6.25,6.267s6.25-2.812,6.25-6.267C15.25,6.252,9.728,1.389,9.493,1.185Zm-.493,14.315c-1.523,0-2.762-1.242-2.762-2.769,0-1.822,2.037-3.65,2.27-3.852,.282-.246,.703-.246,.985,0,.232,.202,2.27,2.03,2.27,3.852,0,1.526-1.239,2.769-2.762,2.769Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flame;

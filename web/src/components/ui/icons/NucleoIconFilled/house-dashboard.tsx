import React from 'react';

import type { iconProps } from './iconProps';

function houseDashboard(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house dashboard';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m15.309,5.6021v.001l-5.25-3.99c-.624-.4751-1.495-.4741-2.118,0l-5.25,3.99c-.433.3291-.691.8501-.691,1.3931v7.2539c0,1.5171,1.233,2.75,2.75,2.75h8.5c1.517,0,2.75-1.2329,2.75-2.75v-7.2539c0-.543-.258-1.064-.691-1.394Zm-8.309,7.8979c0,.2761-.2238.5-.5.5h-1c-.2761,0-.5-.2239-.5-.5v-1c0-.2761.2239-.5.5-.5h1c.2762,0,.5.2239.5.5v1Zm0-3c0,.2761-.2238.5-.5.5h-1c-.2761,0-.5-.2239-.5-.5v-1c0-.2761.2239-.5.5-.5h1c.2762,0,.5.2239.5.5v1Zm3,3c0,.2761-.2238.5-.5.5h-1c-.2761,0-.5-.2239-.5-.5v-1c0-.2761.2239-.5.5-.5h1c.2762,0,.5.2239.5.5v1Zm0-3c0,.2761-.2238.5-.5.5h-1c-.2761,0-.5-.2239-.5-.5v-1c0-.2761.2239-.5.5-.5h1c.2762,0,.5.2239.5.5v1Zm3,3c0,.2761-.2238.5-.5.5h-1c-.2761,0-.5-.2239-.5-.5v-1c0-.2761.2239-.5.5-.5h1c.2762,0,.5.2239.5.5v1Zm0-3c0,.2761-.2238.5-.5.5h-1c-.2761,0-.5-.2239-.5-.5v-1c0-.2761.2239-.5.5-.5h1c.2762,0,.5.2239.5.5v1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default houseDashboard;

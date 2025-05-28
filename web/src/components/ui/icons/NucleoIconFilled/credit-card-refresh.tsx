import React from 'react';

import type { iconProps } from './iconProps';

function creditCardRefresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px credit card refresh';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17,5.75c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v.75H17v-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.5,14c0-2.757,2.243-5,5-5,.401,0,.798,.047,1.181,.139,.348-.34,.81-.557,1.319-.614v-.525H1v4.25c0,1.517,1.233,2.75,2.75,2.75h5.851c-.066-.323-.101-.658-.101-1Zm-2.25-2h-3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M17.25,10c-.414,0-.75,.336-.75,.75v.375c-.572-.398-1.263-.625-2-.625-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5c.96,0,1.888-.4,2.546-1.098,.284-.301,.27-.776-.031-1.06s-.775-.27-1.061,.031c-.381,.405-.897,.627-1.454,.627-1.103,0-2-.897-2-2s.897-2,2-2c.494,0,.94,.193,1.295,.5h-1.045c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default creditCardRefresh;

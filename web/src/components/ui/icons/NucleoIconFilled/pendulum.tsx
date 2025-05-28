import React from 'react';

import type { iconProps } from './iconProps';

function pendulum(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pendulum';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,3.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h14.5Z"
          fill="currentColor"
        />
        <path
          d="M10,11.638V5.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.388c-.871,.311-1.5,1.135-1.5,2.112,0,1.241,1.009,2.25,2.25,2.25s2.25-1.009,2.25-2.25c0-.977-.629-1.801-1.5-2.112Z"
          fill="currentColor"
        />
        <path
          d="M17.94,13.013c-.223-.951-1.023-1.613-1.943-1.716l-1.457-6.218c-.095-.403-.5-.653-.901-.56-.403,.095-.654,.498-.56,.901l1.457,6.22c-.777,.501-1.201,1.448-.979,2.398,.243,1.036,1.17,1.737,2.191,1.737,.169,0,.341-.02,.513-.06,1.208-.283,1.96-1.496,1.678-2.704Z"
          fill="currentColor"
        />
        <path
          d="M4.5,11.638V5.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v6.388c-.871,.311-1.5,1.135-1.5,2.112,0,1.241,1.009,2.25,2.25,2.25s2.25-1.009,2.25-2.25c0-.977-.629-1.801-1.5-2.112Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pendulum;

import React from 'react';

import type { iconProps } from './iconProps';

function chartActivity2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.5,11c-.318,0-.602-.2-.707-.5l-2.272-6.438-.809,2.426c-.102.306-.389.513-.711.513H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h1.709l1.329-3.987c.101-.304.384-.51.705-.513h.006c.318,0,.602.2.707.5l2.272,6.438.809-2.426c.102-.306.389-.513.711-.513h2.25c.414,0,.75.336.75.75s-.336.75-.75.75h-1.709l-1.329,3.987c-.101.304-.384.51-.705.513h-.006Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chartActivity2;

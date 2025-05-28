import React from 'react';

import type { iconProps } from './iconProps';

function users6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="7" fill="currentColor" r="2.75" />
        <circle cx="4.25" cy="3.25" fill="currentColor" r="2.25" />
        <circle cx="13.75" cy="3.25" fill="currentColor" r="2.25" />
        <path
          d="M13.64,14.481c-.472-2.162-2.424-3.731-4.64-3.731s-4.168,1.569-4.64,3.731c-.189,.864,.348,1.749,1.224,2.013,1.108,.335,2.258,.506,3.416,.506s2.308-.17,3.416-.506c.876-.265,1.413-1.149,1.224-2.013Z"
          fill="currentColor"
        />
        <path
          d="M6.018,10.022c-.782-.771-1.268-1.84-1.268-3.022,0-.166,.03-.323,.049-.484-.132-.007-.262-.015-.406-.019l-.143-.003C2.266,6.494,.538,7.835,.05,9.757c-.224,.881,.331,1.81,1.236,2.072,.613,.178,1.434,.373,2.394,.404,.575-.929,1.386-1.689,2.338-2.21Z"
          fill="currentColor"
        />
        <path
          d="M11.982,10.022c.782-.771,1.268-1.84,1.268-3.022,0-.166-.03-.323-.049-.484,.132-.007,.262-.015,.406-.019l.143-.003c1.984,0,3.712,1.341,4.2,3.263,.224,.881-.331,1.81-1.236,2.072-.613,.178-1.434,.373-2.394,.404-.575-.929-1.386-1.689-2.338-2.21Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default users6;

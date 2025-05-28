import React from 'react';

import type { iconProps } from './iconProps';

function caretLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.708,1.579c-.49-.262-1.081-.233-1.54.074l-4.647,3.099c-.418.279-.668.746-.668,1.248s.25.969.668,1.248l4.647,3.099c.251.167.541.252.832.252.242,0,.485-.059.708-.178.488-.261.792-.768.792-1.322V2.901c0-.554-.304-1.061-.792-1.322Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default caretLeft;

import React from 'react';

import type { iconProps } from './iconProps';

function caretMaximizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret maximize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.383,4.93c-.375-.155-.803-.07-1.09.217l-4.146,4.146c-.287.287-.372.715-.217,1.09s.518.617.924.617h4.146c.551,0,1-.449,1-1v-4.146c0-.406-.242-.769-.617-.924Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.146,1H2c-.551,0-1,.449-1,1v4.146c0,.406.242.769.617.924.125.052.255.077.384.077.26,0,.514-.102.706-.293L6.854,2.707c.287-.287.372-.715.217-1.09s-.518-.617-.924-.617Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default caretMaximizeDiagonal2;

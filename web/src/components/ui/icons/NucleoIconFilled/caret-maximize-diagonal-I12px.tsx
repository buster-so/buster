import React from 'react';

import type { iconProps } from './iconProps';

function caretMaximizeDiagonal(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret maximize diagonal';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14,3h-4.646c-.406,0-.769,.242-.924,.617s-.07,.803,.217,1.09l4.646,4.646c.192,.192,.446,.293,.706,.293,.129,0,.259-.025,.384-.077,.375-.155,.617-.518,.617-.924V4c0-.551-.449-1-1-1Z"
          fill="currentColor"
        />
        <path
          d="M4.707,8.646c-.287-.287-.714-.373-1.09-.217-.375,.155-.617,.518-.617,.924v4.646c0,.551,.449,1,1,1h4.646c.406,0,.769-.242,.924-.617s.07-.803-.217-1.09l-4.646-4.646Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretMaximizeDiagonal;

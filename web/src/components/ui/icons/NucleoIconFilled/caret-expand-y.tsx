import React from 'react';

import type { iconProps } from './iconProps';

function caretExpandY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px caret expand y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.249,7H3.751c-.382,0-.725.212-.895.554-.17.342-.133.743.096,1.048l2.249,2.984c.188.25.487.398.799.398s.611-.149.799-.398l2.249-2.984c.229-.305.267-.707.096-1.048-.17-.341-.513-.554-.895-.554Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.799.414c-.376-.499-1.222-.499-1.598,0l-2.249,2.984c-.229.305-.267.707-.096,1.048.17.341.513.554.895.554h4.497c.382,0,.725-.212.895-.554.17-.342.133-.743-.096-1.048L6.799.414Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default caretExpandY;

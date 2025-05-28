import React from 'react';

import type { iconProps } from './iconProps';

function sparkle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sparkle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m3.492,10.508l-.946.315-.316.947c-.102.306-.609.306-.711,0l-.316-.947-.946-.315c-.153-.051-.257-.194-.257-.356s.104-.305.257-.356l.946-.315.316-.947c.051-.153.194-.256.355-.256s.305.104.355.256l.316.947.946.315c.153.051.257.194.257.356s-.104.305-.257.356h0Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.526,4.803l-3.102-1.227L7.197.474c-.113-.286-.39-.474-.697-.474s-.584.188-.697.474l-1.227,3.102-3.102,1.227c-.286.113-.474.39-.474.697s.188.584.474.697l3.102,1.227,1.227,3.102c.113.286.39.474.697.474s.584-.188.697-.474l1.227-3.102,3.102-1.227c.286-.113.474-.39.474-.697s-.188-.584-.474-.697Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default sparkle2;

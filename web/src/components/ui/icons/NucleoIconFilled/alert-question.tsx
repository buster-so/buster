import React from 'react';

import type { iconProps } from './iconProps';

function alertQuestion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px alert question';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6" cy="10.5" fill="currentColor" r="1" strokeWidth="0" />
        <path
          d="m6,8.25c-.011,0-.023,0-.034,0-.414-.019-.734-.369-.715-.783.07-1.564.934-2.238,1.564-2.729.553-.432.798-.646.818-1.218.033-.988-.711-1.234-1.341-1.267-.808-.048-1.426.412-1.637,1.215-.105.401-.513.638-.916.535-.4-.105-.64-.515-.535-.916.393-1.495,1.624-2.413,3.165-2.332,1.733.089,2.818,1.195,2.763,2.816-.043,1.296-.792,1.88-1.395,2.35-.551.43-.949.74-.988,1.614-.018.402-.35.716-.749.716Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default alertQuestion;

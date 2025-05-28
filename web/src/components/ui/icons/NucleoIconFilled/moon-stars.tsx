import React from 'react';

import type { iconProps } from './iconProps';

function moonStars(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px moon stars';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.744,2.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316.947-.946.315c-.153.051-.257.194-.257.356s.104.305.257.356l.946.315.316.947c.051.153.194.256.355.256s.305-.104.355-.256l.316-.947.946-.315c.153-.051.257-.194.257-.356s-.104-.305-.257-.356h.001Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.543,6.129c-.269-.154-.604-.125-.846.07-.642.524-1.402.801-2.197.801-1.93,0-3.5-1.57-3.5-3.5,0-.795.277-1.555.801-2.197.196-.24.224-.576.07-.846-.153-.269-.457-.416-.763-.37C2.148.532,0,3.019,0,6c0,3.309,2.691,6,6,6,2.981,0,5.468-2.148,5.913-5.108.046-.306-.101-.609-.37-.763Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default moonStars;

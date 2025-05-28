import React from 'react';

import type { iconProps } from './iconProps';

function ufo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ufo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="14.75" cy="1.75" fill="currentColor" r=".75" />
        <path
          d="M3.869,1.894l-.947-.315-.315-.947c-.103-.306-.609-.306-.712,0l-.315,.947-.947,.315c-.153,.051-.256,.194-.256,.356s.104,.305,.256,.356l.947,.315,.315,.947c.051,.153,.194,.256,.356,.256s.305-.104,.356-.256l.315-.947,.947-.315c.153-.051,.256-.194,.256-.356s-.104-.305-.256-.356Z"
          fill="currentColor"
        />
        <path
          d="M5.223,5.526c-.012-.115-.015-.216-.015-.334,0-1.887,1.53-3.417,3.417-3.417,1.575,0,2.901,1.066,3.297,2.516"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.865,8.894c-2.701,.164-4.701-.232-4.844-1.07-.187-1.094,2.861-2.527,6.808-3.201,3.947-.674,7.298-.334,7.485,.76,.151,.886-1.822,1.995-4.676,2.743"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.006 7.689L6 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11 7L16.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="9.002"
          cy="7.34"
          fill="currentColor"
          rx="2.026"
          ry=".316"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(-9.918 9 7.342)"
        />
      </g>
    </svg>
  );
}

export default ufo;

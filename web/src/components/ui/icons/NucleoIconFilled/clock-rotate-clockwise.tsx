import React from 'react';

import type { iconProps } from './iconProps';

function clockRotateClockwise(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px clock rotate clockwise';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,0C3.381,0,1.085,1.674.286,4.167c-.127.395.091.817.485.943.399.13.817-.091.942-.485.6-1.869,2.321-3.125,4.286-3.125,2.481,0,4.5,2.019,4.5,4.5s-2.019,4.5-4.5,4.5c-1.311,0-2.516-.556-3.356-1.5h1.606c.414,0,.75-.336.75-.75s-.336-.75-.75-.75H1.25c-.414,0-.75.336-.75.75v3c0,.414.336.75.75.75s.75-.336.75-.75v-.784c1.078.97,2.483,1.534,4,1.534,3.309,0,6-2.691,6-6S9.309,0,6,0Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8,8.5c-.176,0-.352-.061-.494-.186l-2-1.75c-.162-.143-.256-.348-.256-.564v-2.75c0-.414.336-.75.75-.75s.75.336.75.75v2.41l1.744,1.526c.312.273.343.747.07,1.058-.148.169-.356.256-.564.256Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default clockRotateClockwise;

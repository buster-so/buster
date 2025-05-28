import React from 'react';

import type { iconProps } from './iconProps';

function boltSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bolt slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m3.734,11h3.266l4-4h-.92l.517-5.124c.065-.458-.189-.898-.62-1.07-.43-.172-.918-.027-1.186.35L2.918,9.421c-.217.307-.244.705-.072,1.038s.513.541.888.541Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m14.266,7h-.084l-6.515,6.515-.263,2.608c-.065.458.189.898.62,1.07.121.048.247.072.372.072.316,0,.622-.151.814-.422l5.874-8.265c.217-.307.244-.705.072-1.038s-.513-.541-.888-.541Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293.768-.293,1.061,0s.293.768,0,1.061L2.53,16.53c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default boltSlash;

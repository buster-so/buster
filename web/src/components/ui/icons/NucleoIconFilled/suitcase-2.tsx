import React from 'react';

import type { iconProps } from './iconProps';

function suitcase2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px suitcase 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m8.25,4.5c-.414,0-.75-.336-.75-.75V1.75c0-.138-.112-.25-.25-.25h-2.5c-.138,0-.25.112-.25.25v2c0,.414-.336.75-.75.75s-.75-.336-.75-.75V1.75c0-.965.785-1.75,1.75-1.75h2.5c.965,0,1.75.785,1.75,1.75v2c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.009,6.046c1.675.632,3.354.953,4.993.957,1.636-.004,3.314-.325,4.983-.955.011-.004.372-.142.998-.463-.087-1.439-1.273-2.586-2.733-2.586H2.75C1.289,3,.102,4.148.016,5.588c.625.319.983.455.992.458Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.509,7.454c-1.833.69-3.687,1.044-5.507,1.049-1.824-.004-3.678-.358-5.517-1.051-.025-.009-.198-.075-.485-.205v1.503c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75v-1.503c-.29.131-.464.198-.491.208Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default suitcase2;

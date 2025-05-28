import React from 'react';

import type { iconProps } from './iconProps';

function immersiveSlider(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px immersive slider';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m16.5029,2.3164c-.3076-.1782-.6895-.1802-.999-.0039l-2.9531,1.6875h-7.1016l-2.9541-1.6875c-.3066-.1763-.6895-.1743-.998.0039-.3066.1782-.4971.5093-.4971.8643v11.1387c0,.355.1904.686.4971.8643.3086.1782.6904.1802.999.0039l2.9531-1.6875h7.1016l2.9541,1.6875c.1523.0874.3242.1313.4951.1313.1738-.0005.3477-.0454.5029-.1353.3066-.1782.4971-.5093.4971-.8643V3.1807c0-.355-.1904-.686-.4971-.8643ZM2.5,13.4575V4.0425l2.3779,1.3589c.0372.021.0822.0178.1221.0322v6.6328c-.0399.0144-.0849.0112-.1221.0322l-2.3779,1.3589Zm13,0l-2.3779-1.3589c-.0372-.021-.0822-.0178-.1221-.0322v-6.6328c.0399-.0144.0849-.0112.1221-.0322l2.3779-1.3589v9.415Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m12.25,16.5h-3.5c-.4141,0-.75-.3359-.75-.75s.3359-.75.75-.75h3.5c.4141,0,.75.3359.75.75s-.3359.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="5.75" cy="15.75" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default immersiveSlider;

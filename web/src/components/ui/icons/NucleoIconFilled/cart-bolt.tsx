import React from 'react';

import type { iconProps } from './iconProps';

function cartBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="3.75" cy="15.75" fill="currentColor" r="1.25" strokeWidth="0" />
        <circle cx="14.25" cy="15.75" fill="currentColor" r="1.25" strokeWidth="0" />
        <path
          d="m15.25,12.5H4.5c-.276,0-.5-.224-.5-.5s.224-.5.5-.5h8.529c.754,0,1.421-.48,1.66-1.196l.355-1.064c-.317.166-.672.26-1.044.26-.328,0-.646-.069-.944-.207-1.018-.473-1.535-1.634-1.206-2.704l.036-.119c-.677-.111-1.273-.527-1.609-1.14-.227-.414-.298-.878-.247-1.33h-5.265l-.176-1.196c-.103-.704-.616-1.271-1.307-1.444l-1.351-.337c-.403-.1-.809.144-.909.546-.101.402.144.809.546.909l1.35.337c.099.025.172.105.187.207l1.032,7.015c-.93.172-1.637.985-1.637,1.963,0,1.103.897,2,2,2h10.75c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m16.908,3.391c-.132-.241-.384-.391-.658-.391h-1.653l.62-2.031c.11-.358-.062-.742-.401-.9-.338-.155-.744-.04-.946.275l-2.25,3.5c-.148.231-.159.524-.027.765s.384.391.658.391h1.653l-.62,2.031c-.11.358.062.742.401.9.102.047.209.069.315.069.248,0,.489-.124.631-.344l2.25-3.5c.148-.231.159-.524.027-.765Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default cartBolt;

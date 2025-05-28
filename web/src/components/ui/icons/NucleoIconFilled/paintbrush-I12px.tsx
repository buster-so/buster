import React from 'react';

import type { iconProps } from './iconProps';

function paintbrush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paintbrush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.318,1.931c-.79-.789-2.166-.79-2.957,0l-5.145,5.145c.673,.25,1.294,.631,1.817,1.156,.525,.527,.897,1.145,1.14,1.802l5.146-5.146c.815-.815,.815-2.142,0-2.958Z"
          fill="currentColor"
        />
        <path
          d="M8.97,9.291c-.669-.671-1.554-1.041-2.494-1.041h-.006c-.936,.002-1.817,.372-2.48,1.043-.952,.962-1.119,1.933-1.252,2.712-.149,.869-.247,1.442-1.347,2.043-.266,.145-.418,.435-.387,.736,.032,.301,.241,.554,.53,.641,1.058,.318,2.185,.58,3.306,.58,1.438,0,2.867-.43,4.13-1.724,1.371-1.375,1.371-3.614,0-4.989Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paintbrush;

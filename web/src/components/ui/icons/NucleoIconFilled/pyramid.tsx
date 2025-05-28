import React from 'react';

import type { iconProps } from './iconProps';

function pyramid(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pyramid';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.26,9.541L10.403,1.703c-.667-.894-2.14-.892-2.806,0L1.74,9.541c-.572,.767-.416,1.858,.347,2.434l5.857,4.422c.311,.234,.684,.352,1.056,.352s.745-.118,1.057-.352l5.856-4.422c.764-.576,.919-1.667,.347-2.434Zm-1.251,1.237l-5.856,4.422c-.045,.033-.099,.05-.153,.05V2.5c.047,0,.136,.013,.201,.1h0l5.856,7.838c.081,.108,.06,.257-.049,.339Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pyramid;

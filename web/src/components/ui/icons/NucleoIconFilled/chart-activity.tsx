import React from 'react';

import type { iconProps } from './iconProps';

function chartActivity(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chart activity';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m.75,10.5c-.157,0-.314-.049-.45-.15-.331-.249-.398-.719-.15-1.05l2.25-3c.163-.216.431-.328.698-.293.269.036.498.213.598.465l.408,1.021,2.237-4.102c.146-.268.442-.418.744-.386.303.035.556.25.637.544l.728,2.622,2.128-4.256c.186-.37.636-.519,1.006-.335.371.186.521.636.335,1.006l-3,6c-.139.278-.439.438-.743.411-.309-.03-.567-.247-.65-.546l-.755-2.717-2.114,3.876c-.139.255-.412.414-.703.389-.29-.017-.544-.2-.652-.47l-.504-1.261-1.449,1.933c-.147.196-.373.3-.601.3Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chartActivity;

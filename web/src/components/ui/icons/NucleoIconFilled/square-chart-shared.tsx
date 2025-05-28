import React from 'react';

import type { iconProps } from './iconProps';

function squareChartShared(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square chart shared';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.509,9.5c-.89,0-1.73-.434-2.249-1.161-.514-.723-.647-1.651-.36-2.483,.362-1.038,1.046-1.894,1.911-2.484-.157-.27-.28-.56-.355-.872H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.75c0,1.517,1.233,2.75,2.75,2.75H12.25c1.517,0,2.75-1.233,2.75-2.75v-4.25h-2.491Zm-7.009,3.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-4.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.25Zm3.25,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V6.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5Zm3.25,0c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2Z"
          fill="currentColor"
        />
        <path
          d="M16.71,8h-4.201c-.406,0-.79-.199-1.027-.532-.232-.327-.294-.747-.164-1.122,.489-1.403,1.812-2.346,3.292-2.346s2.803,.943,3.291,2.346c.131,.376,.069,.795-.163,1.123-.237,.333-.621,.532-1.027,.532Z"
          fill="currentColor"
        />
        <circle cx="14.609" cy="1.75" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default squareChartShared;

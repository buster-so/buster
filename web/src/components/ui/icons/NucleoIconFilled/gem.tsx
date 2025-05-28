import React from 'react';

import type { iconProps } from './iconProps';

function gem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px gem';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.524,3.298l-1.606-1.733c-.333-.359-.803-.565-1.29-.565H3.372c-.487,0-.957.206-1.29.565L.476,3.298c-.585.631-.637,1.591-.123,2.283l4.234,5.706c.336.454.852.714,1.413.714s1.077-.26,1.413-.714l4.234-5.705c.514-.692.462-1.652-.123-2.283Zm-3.274,2.202H3.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h4.5c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default gem;

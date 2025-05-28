import React from 'react';

import type { iconProps } from './iconProps';

function dropCap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px drop cap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,15.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,12H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,8.5h-4.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,5h-4.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.652,7.984L6.382,1.984c-.11-.292-.39-.484-.702-.484h-.625c-.312,0-.591,.193-.702,.484L2.083,7.984c-.146,.388,.049,.82,.436,.967,.387,.146,.821-.048,.967-.436l.384-1.016h2.994l.384,1.016c.114,.3,.399,.484,.702,.484,.088,0,.178-.016,.266-.048,.387-.147,.583-.58,.436-.967Zm-4.214-1.984l.93-2.457,.93,2.457h-1.859Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default dropCap;

import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldDownToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold down to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.987,13.539c.234,.324,.613,.517,1.013,.517h0c.4,0,.778-.194,1.012-.517l4.021-5.556c.277-.383,.315-.881,.101-1.302-.215-.42-.641-.681-1.113-.681h-1.521V2.75c0-.965-.785-1.75-1.75-1.75h-1.5c-.965,0-1.75,.785-1.75,1.75v3.25h-1.521c-.472,0-.898,.261-1.113,.681-.214,.42-.176,.919,.101,1.302l4.021,5.556Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15.5H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldDownToLine;

import React from 'react';

import type { iconProps } from './iconProps';

function thumbsUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px thumbs up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.331,7.073c-.525-.682-1.319-1.073-2.179-1.073h-3.326l.798-2.167c.463-1.256-.091-2.655-1.289-3.254-.307-.153-.679-.079-.903,.181L5.168,5.697c-.431,.5-.668,1.138-.668,1.797v5.756c0,1.517,1.234,2.75,2.75,2.75h5.71c1.246,0,2.339-.841,2.659-2.046l1.191-4.5c.22-.832,.045-1.699-.479-2.381Z"
          fill="currentColor"
        />
        <path
          d="M4.25,16h-1.5c-.965,0-1.75-.785-1.75-1.75V7.75c0-.965,.785-1.75,1.75-1.75h1.5c.965,0,1.75,.785,1.75,1.75v6.5c0,.965-.785,1.75-1.75,1.75ZM2.75,7.5c-.138,0-.25,.112-.25,.25v6.5c0,.138,.112,.25,.25,.25h1.5c.138,0,.25-.112,.25-.25V7.75c0-.138-.112-.25-.25-.25h-1.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default thumbsUp;

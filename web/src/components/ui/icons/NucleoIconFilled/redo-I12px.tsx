import React from 'react';

import type { iconProps } from './iconProps';

function redo(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px redo';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3,10.75c-.209,0-.417-.087-.565-.256-.273-.312-.241-.786,.071-1.058,.838-.733,3.148-2.437,6.494-2.437,3.324,0,5.629,1.687,6.466,2.412,.313,.271,.347,.745,.076,1.058-.271,.312-.744,.348-1.058,.076-.709-.615-2.665-2.046-5.483-2.046-2.837,0-4.796,1.444-5.506,2.065-.142,.125-.318,.186-.493,.186Z"
          fill="currentColor"
        />
        <path
          d="M10.469,11.972c-.331,0-.633-.22-.724-.555-.108-.4,.129-.812,.529-.919l3.738-1.008-1.341-3.632c-.144-.389,.055-.82,.444-.963,.388-.145,.82,.055,.963,.444l1.625,4.402c.073,.198,.06,.417-.037,.604s-.268,.325-.471,.38l-4.53,1.222c-.065,.018-.131,.026-.196,.026Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default redo;

import React from 'react';

import type { iconProps } from './iconProps';

function lightbulb(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lightbulb';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.625,2.286c-1.351-1.098-3.121-1.519-4.856-1.158-2.227,.465-4.002,2.286-4.417,4.531-.444,2.399,.612,4.75,2.649,5.992v2.599c0,1.517,1.234,2.75,2.75,2.75h.5c1.517,0,2.75-1.233,2.75-2.75v-2.599c1.708-1.042,2.75-2.88,2.75-4.901,0-1.739-.775-3.366-2.125-4.464Zm-3.375,13.214h-.5c-.689,0-1.25-.561-1.25-1.25v-1.25h3v1.25c0,.689-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default lightbulb;

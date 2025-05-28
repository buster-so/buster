import React from 'react';

import type { iconProps } from './iconProps';

function lightbulb2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px lightbulb 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.625,2.286c-1.351-1.098-3.121-1.519-4.856-1.158-2.227,.465-4.002,2.286-4.417,4.531-.444,2.399,.612,4.75,2.649,5.992v2.599c0,1.517,1.234,2.75,2.75,2.75h.5c1.517,0,2.75-1.233,2.75-2.75v-2.599c1.708-1.042,2.75-2.88,2.75-4.901,0-1.739-.775-3.366-2.125-4.464Zm-3.375,13.214h-.5c-.601,0-1.08-.434-1.199-1h2.899c-.119,.566-.599,1-1.199,1Zm1.25-2.5h-3v-1h3v1Zm1.03-6.22l-1.78,1.78v1.189c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.189l-1.78-1.78c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.47,1.47,1.47-1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default lightbulb2;

import React from 'react';

import type { iconProps } from './iconProps';

function suitcasePin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px suitcase pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.75,5.5c-.414,0-.75-.336-.75-.75V2.25c0-.138-.112-.25-.25-.25h-3.5c-.138,0-.25,.112-.25,.25v2.5c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V2.25c0-.965,.785-1.75,1.75-1.75h3.5c.965,0,1.75,.785,1.75,1.75v2.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.5,13.25c0-2.757,2.243-5,5-5,.915,0,1.762,.265,2.5,.696v-2.196c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h6.536c-.461-.777-.786-1.695-.786-2.75Z"
          fill="currentColor"
        />
        <path
          d="M14.5,9.75c-1.93,0-3.5,1.57-3.5,3.5,0,2.655,3.011,4.337,3.14,4.408,.112,.062,.236,.092,.36,.092s.248-.031,.36-.092c.129-.07,3.14-1.753,3.14-4.408,0-1.93-1.57-3.5-3.5-3.5Zm0,4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default suitcasePin;

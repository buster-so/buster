import React from 'react';

import type { iconProps } from './iconProps';

function userRefresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user refresh';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M8.5,14c0-2.019,1.209-3.753,2.937-4.542-.769-.287-1.587-.458-2.437-.458-2.765,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.592,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.17,0,.34-.014,.509-.02-.625-.835-1.009-1.86-1.009-2.98Z"
          fill="currentColor"
        />
        <path
          d="M16.25,10c-.414,0-.75,.336-.75,.75v.375c-.572-.398-1.263-.625-2-.625-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5c.96,0,1.888-.4,2.546-1.098,.284-.301,.27-.776-.031-1.06s-.776-.27-1.061,.031c-.381,.405-.897,.627-1.454,.627-1.103,0-2-.897-2-2s.897-2,2-2c.494,0,.94,.193,1.295,.5h-1.045c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5c.414,0,.75-.336,.75-.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userRefresh;

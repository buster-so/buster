import React from 'react';

import type { iconProps } from './iconProps';

function calendarPen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h4.546c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v1.275c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.525c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.107,10.438c-.563-.563-1.538-.566-2.098-.005l-3.693,3.694c-.164,.164-.292,.358-.38,.577l-.63,1.561c-.112,.277-.048,.595,.162,.808,.144,.145,.337,.223,.534,.223,.092,0,.184-.017,.272-.051l1.513-.59c.228-.088,.431-.221,.603-.394l3.725-3.725c.281-.282,.434-.654,.432-1.05-.002-.395-.158-.767-.438-1.047Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarPen;

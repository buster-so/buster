import React from 'react';

import type { iconProps } from './iconProps';

function pinSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.773,9.227c-.858-.112-1.523-.838-1.523-1.727,0-.966,.784-1.75,1.75-1.75,.889,0,1.615,.665,1.727,1.523l3.635-3.635c-1.249-1.691-3.326-2.637-5.362-2.637C5.791,1,2.471,3.344,2.471,7.267c0,1.671,1.166,3.817,2.517,5.746l3.785-3.785Z"
          fill="currentColor"
        />
        <path
          d="M6.352,14.83c.465,.581,.914,1.112,1.308,1.562,.339,.387,.827,.609,1.34,.609s1.001-.222,1.339-.608c1.938-2.21,5.19-6.335,5.19-9.125,0-.511-.059-.994-.164-1.45L6.352,14.83Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default pinSlash;

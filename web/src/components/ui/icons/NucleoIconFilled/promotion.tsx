import React from 'react';

import type { iconProps } from './iconProps';

function promotion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px promotion';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,1H5.75c-1.517,0-2.75,1.233-2.75,2.75v12.5c0,.276,.152,.531,.396,.661,.242,.131,.54,.115,.77-.037l4.834-3.223,4.834,3.223c.126,.083,.271,.126,.416,.126,.121,0,.243-.029,.354-.089,.244-.13,.396-.385,.396-.661V3.75c0-1.517-1.233-2.75-2.75-2.75ZM7,5c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Zm.561,5.748c-.148,.167-.354,.252-.561,.252-.178,0-.355-.062-.498-.189-.31-.275-.338-.749-.062-1.059l4-4.5c.276-.311,.751-.336,1.059-.062,.31,.275,.338,.749,.062,1.059l-4,4.5Zm3.439,.252c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default promotion;

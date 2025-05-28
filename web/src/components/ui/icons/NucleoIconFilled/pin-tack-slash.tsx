import React from 'react';

import type { iconProps } from './iconProps';

function pinTackSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin tack slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.75,13h1.25L13,5v-1.25c0-1.517-1.233-2.75-2.75-2.75h-2.5c-1.517,0-2.75,1.233-2.75,2.75v3.959c-.352,.4-.663,.832-.929,1.288-.563,.965-.921,2.027-1.065,3.158-.027,.214,.039,.429,.181,.59,.143,.162,.348,.254,.563,.254Z"
          fill="currentColor"
        />
        <path
          d="M13.21,7.972l-4.96,5.028v3.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.25h4.5c.215,0,.42-.093,.563-.254,.142-.162,.208-.376,.181-.59-.144-1.131-.502-2.193-1.065-3.158-.21-.36-.456-.699-.72-1.025Z"
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

export default pinTackSlash;

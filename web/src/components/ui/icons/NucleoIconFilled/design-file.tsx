import React from 'react';

import type { iconProps } from './iconProps';

function designFile(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px design file';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.487,5.427l-3.914-3.914c-.326-.326-.776-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.664c0-.467-.182-.907-.513-1.237ZM4.528,7.648c-.125-.217-.123-.486,.003-.702l1.33-2.279c.249-.428,.957-.43,1.208,0l1.33,2.28c.126,.215,.127,.483,.003,.701s-.357,.352-.607,.352h-2.659c-.25,0-.483-.135-.607-.352Zm4.972,4.952c0,.496-.404,.9-.9,.9h-1.699c-.496,0-.9-.404-.9-.9v-1.7c0-.496,.404-.9,.9-.9h1.699c.496,0,.9,.404,.9,.9v1.7Zm2-2.6c-1.103,0-2-.897-2-2s.897-2,2-2,2,.897,2,2-.897,2-2,2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default designFile;

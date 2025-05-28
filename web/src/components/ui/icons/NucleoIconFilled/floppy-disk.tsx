import React from 'react';

import type { iconProps } from './iconProps';

function floppyDisk(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px floppy disk';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.987,4.927l-2.914-2.914c-.331-.331-.77-.513-1.237-.513H4.41c-1.604,0-2.91,1.306-2.91,2.91V13.59c0,1.604,1.306,2.91,2.91,2.91H13.59c1.604,0,2.91-1.306,2.91-2.91V6.164c0-.467-.182-.907-.513-1.237ZM5,3h6v2c0,.55-.45,1-1,1H6c-.55,0-1-.45-1-1V3ZM13,15H5v-4c0-.55,.45-1,1-1h6c.55,0,1,.45,1,1v4Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default floppyDisk;

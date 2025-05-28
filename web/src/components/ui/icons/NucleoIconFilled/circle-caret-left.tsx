import React from 'react';

import type { iconProps } from './iconProps';

function circleCaretLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle caret left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm2,10.022c0,.602-.672,.958-1.17,.621l-2.987-2.022c-.439-.298-.439-.945,0-1.242l2.987-2.022c.498-.337,1.17,.02,1.17,.621v4.044Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleCaretLeft;

import React from 'react';

import type { iconProps } from './iconProps';

function flipHorizontal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flip horizontal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.22,2.876c-.458-.103-.92,.121-1.122,.544L1.415,13.21c-.08,.167-.122,.354-.122,.54,0,.689,.561,1.25,1.25,1.25H7.25c.414,0,.75-.336,.75-.75V3.852c0-.471-.321-.872-.78-.976Zm-.72,10.624H2.939l3.561-7.444v7.444Z"
          fill="currentColor"
        />
        <path
          d="M11.903,3.422c-.203-.425-.665-.648-1.123-.545-.459,.104-.78,.505-.78,.976V14.25c0,.414,.336,.75,.75,.75h4.707c.689,0,1.25-.561,1.25-1.25,0-.186-.042-.372-.122-.54L11.903,3.422Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default flipHorizontal2;

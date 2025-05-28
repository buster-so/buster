import React from 'react';

import type { iconProps } from './iconProps';

function circleDashed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle dashed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.854.819c-.278-.045-.563-.069-.854-.069s-.576.024-.854.069"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.267,2.94c-.164-.229-.349-.447-.555-.652s-.424-.39-.652-.555"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m11.181,6.854c.045-.278.069-.563.069-.854,0-.291-.024-.576-.069-.854"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.06,10.267c.229-.164.447-.349.652-.555s.39-.424.555-.652"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.146,11.181c.278.045.563.069.854.069s.576-.024.854-.069"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.733,9.06c.164.229.349.447.555.652s.424.39.652.555"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m.819,5.146c-.045.278-.069.563-.069.854,0,.291.024.576.069.854"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.94,1.733c-.229.164-.447.349-.652.555s-.39.424-.555.652"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default circleDashed;

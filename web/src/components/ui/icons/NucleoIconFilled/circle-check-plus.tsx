import React from 'react';

import type { iconProps } from './iconProps';

function circleCheckPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle check plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8c1.01,0,1.973-.196,2.864-.539-1.056-.185-1.864-1.103-1.864-2.211,0-1.241,1.01-2.25,2.25-2.25h.25v-.25c0-1.241,1.01-2.25,2.25-2.25,.903,0,1.678,.538,2.036,1.308,.135-.582,.214-1.185,.214-1.808,0-4.411-3.589-8-8-8Zm3.844,5.708l-4.25,5.5c-.137,.176-.344,.283-.565,.291-.01,0-.019,0-.028,0-.212,0-.415-.09-.558-.248l-2.25-2.5c-.277-.308-.252-.782,.056-1.06s.782-.253,1.06,.056l1.648,1.832,3.7-4.789c.254-.328,.724-.388,1.053-.135,.327,.253,.388,.724,.135,1.052Z"
          fill="currentColor"
        />
        <path
          d="M17.25,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleCheckPlus;

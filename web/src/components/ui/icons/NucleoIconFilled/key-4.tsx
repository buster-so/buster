import React from 'react';

import type { iconProps } from './iconProps';

function key4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px key 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11,10.25v-1.952c0-.414-.336-.75-.75-.75h-2.5c-.414,0-.75,.336-.75,.75v6.452c0,.141,.039,.278,.114,.397l1.25,2c.137,.219,.377,.353,.636,.353s.499-.133,.636-.353l1.25-2c.075-.119,.114-.257,.114-.397v-1.5c0-.219-.096-.427-.262-.569l-1.086-.931,1.086-.931c.166-.143,.262-.351,.262-.569Z"
          fill="currentColor"
        />
        <path
          d="M9,1c-2.209,0-4,1.791-4,4s1.791,4,4,4,4-1.791,4-4S11.209,1,9,1Zm.707,4.207c-.391,.391-1.024,.391-1.414,0-.391-.39-.391-1.024,0-1.414,.391-.391,1.024-.391,1.414,0,.391,.39,.391,1.024,0,1.414Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default key4;

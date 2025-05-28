import React from 'react';

import type { iconProps } from './iconProps';

function circleHalfDottedClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px circle half dotted clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="m7.282,11.093l-.009-.002.009.002Z" fill="currentColor" strokeWidth="0" />
        <path
          d="m6,12c-.414,0-.75-.336-.75-.75s.336-.75.75-.75c2.481,0,4.5-2.019,4.5-4.5,0-2.481-2.02-4.5-4.5-4.5-.414,0-.75-.336-.75-.75s.336-.75.75-.75c3.308,0,6,2.691,6,6,0,3.309-2.691,6-6,6Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m8,8.5c-.175,0-.351-.061-.493-.186l-2-1.75c-.163-.143-.256-.348-.256-.564v-2.75c0-.414.336-.75.75-.75s.75.336.75.75v2.41l1.744,1.526c.312.273.344.747.071,1.058-.148.169-.356.256-.565.256Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.828,2.725c-.359-.207-.817-.084-1.025.275-.207.359-.084.817.275,1.024.359.207.817.084,1.025-.274.207-.359.084-.817-.275-1.025Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,2.103c.359-.207.482-.666.275-1.024-.207-.359-.666-.482-1.025-.275s-.482.666-.275,1.025c.207.359.666.482,1.025.274Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.078,7.975c-.359.207-.482.666-.275,1.025.207.359.666.482,1.025.274.359-.207.482-.666.275-1.024-.207-.359-.666-.482-1.025-.275Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m3.75,9.897c-.359-.207-.817-.084-1.025.275-.207.359-.084.817.275,1.025.359.207.817.084,1.025-.275.207-.359.084-.817-.275-1.025Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx=".75" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default circleHalfDottedClock;

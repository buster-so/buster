import React from 'react';

import type { iconProps } from './iconProps';

function sun(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px sun';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6" cy="6" fill="currentColor" r="3" strokeWidth="0" />
        <path
          d="m6,2.25c-.414,0-.75-.336-.75-.75v-.75c0-.414.336-.75.75-.75s.75.336.75.75v.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.182,3.568c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l.53-.53c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-.53.53c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m11.25,6.75h-.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.75c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.712,10.462c-.192,0-.384-.073-.53-.22l-.53-.53c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.53.53c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,12c-.414,0-.75-.336-.75-.75v-.75c0-.414.336-.75.75-.75s.75.336.75.75v.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.288,10.462c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l.53-.53c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-.53.53c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m1.5,6.75h-.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h.75c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m2.818,3.568c-.192,0-.384-.073-.53-.22l-.53-.53c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.53.53c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default sun;

import React from 'react';

import type { iconProps } from './iconProps';

function headphones(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px headphones';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.137,15h-1.137c-.227,0-.441-.103-.584-.279-.142-.176-.197-.408-.149-.629l1.084-5c.103-.422,.149-.762,.149-1.091,0-2.481-2.019-4.5-4.5-4.5s-4.5,2.019-4.5,4.5c0,.329,.046,.669,.145,1.071l1.088,5.02c.048,.222-.007,.453-.149,.629-.143,.177-.357,.279-.584,.279h-1.137c-1.285,0-2.415-.912-2.688-2.167l-.334-1.545c-.266-1.224,.33-2.473,1.448-3.037l.712-.359c.058-3.258,2.727-5.891,5.999-5.891s5.941,2.633,5.999,5.891l.712,.359c1.119,.564,1.714,1.813,1.448,3.038l-.334,1.544c-.272,1.256-1.403,2.167-2.688,2.167Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default headphones;

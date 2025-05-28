import React from 'react';

import type { iconProps } from './iconProps';

function circleLogin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle login';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.75,2.75c-3.192,0-5.828,2.407-6.201,5.5h5.89l-1.22-1.22c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.5,2.5c.293,.293,.293,.768,0,1.061l-2.5,2.5c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l1.22-1.22H3.549c.372,3.093,3.009,5.5,6.201,5.5,3.446,0,6.25-2.804,6.25-6.25s-2.804-6.25-6.25-6.25Z"
          fill="currentColor"
        />
        <path
          d="M3.5,9c0-.254,.02-.504,.049-.75H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H3.549c-.03-.246-.049-.496-.049-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleLogin;

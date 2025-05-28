import React from 'react';

import type { iconProps } from './iconProps';

function camera3Off(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px camera 3 off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.879,11.121c-.543-.543-.879-1.293-.879-2.121,0-1.657,1.343-3,3-3,.828,0,1.578,.336,2.121,.879L15.194,2.806c-.498-.498-1.185-.806-1.944-.806H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,.758,.308,1.446,.806,1.944l4.072-4.073Zm-1.879-7.121c.552,0,1,.448,1,1s-.448,1-1,1-1-.448-1-1,.448-1,1-1Z"
          fill="currentColor"
        />
        <path
          d="M11.98,9.202c-.101,1.493-1.285,2.676-2.778,2.777l-4.02,4.021H13.25c1.517,0,2.75-1.233,2.75-2.75V5.182l-4.02,4.021Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default camera3Off;

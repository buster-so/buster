import React from 'react';

import type { iconProps } from './iconProps';

function kickScooter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px kick scooter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.911,10.089c-.346,0-.657-.241-.732-.593l-1.243-5.798c-.024-.115-.127-.198-.244-.198h-1.441c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.441c.82,0,1.539,.582,1.711,1.384l1.243,5.798c.087,.405-.171,.804-.576,.891-.053,.011-.105,.017-.158,.017Z"
          fill="currentColor"
        />
        <path
          d="M13.25,14H7.25c-.414,0-.75-.336-.75-.75,0-1.792-1.458-3.25-3.25-3.25-.348,0-.689,.054-1.016,.162-.397,.133-.817-.085-.947-.478-.129-.394,.085-.817,.479-.947,.478-.157,.978-.237,1.484-.237,2.364,0,4.33,1.736,4.69,4h5.31c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="3.25" cy="13.25" fill="currentColor" r="2.25" />
        <circle cx="14.75" cy="13.25" fill="currentColor" r="2.25" />
      </g>
    </svg>
  );
}

export default kickScooter;

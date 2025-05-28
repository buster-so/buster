import React from 'react';

import type { iconProps } from './iconProps';

function heartUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="13.25"
          cy="11.75"
          fill="currentColor"
          r="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.534,9.12c.292-.771,.466-1.608,.466-2.511,.008-2.12-1.704-3.846-3.827-3.859-1.277,.016-2.464,.66-3.173,1.72-.71-1.061-1.896-1.704-3.173-1.72-2.123,.013-3.834,1.739-3.827,3.859,0,4.826,4.959,7.794,6.529,8.613,.004,.002,.009,.003,.014,.005"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.351,17.25c.34,0,.594-.337,.482-.658-.373-1.072-1.383-1.842-2.583-1.842s-2.21,.77-2.583,1.842c-.112,.321,.142,.658,.482,.658h4.202Z"
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

export default heartUser;

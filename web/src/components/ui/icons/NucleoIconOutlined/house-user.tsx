import React from 'react';
import type { iconProps } from './iconProps';

function houseUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.145,6.2l5.25-3.99c.358-.272,.853-.272,1.21,0l5.25,3.99c.249,.189,.395,.484,.395,.796v7.254c0,1.105-.895,2-2,2H4.75c-1.105,0-2-.895-2-2V6.996c0-.313,.146-.607,.395-.796Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.101,13.25c.34,0,.594-.337,.482-.658-.373-1.072-1.383-1.842-2.583-1.842s-2.21,.77-2.583,1.842c-.112,.321,.142,.658,.482,.658h4.202Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="7.75"
          fill="currentColor"
          r="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default houseUser;

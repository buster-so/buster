import React from 'react';

import type { iconProps } from './iconProps';

function heart2User(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px heart 2 user';

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
          d="M15.351,17.25c.34,0,.594-.337,.482-.658-.373-1.072-1.383-1.842-2.583-1.842s-2.21,.77-2.583,1.842c-.112,.321,.142,.658,.482,.658h4.202Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.387,8.999c.745-.916,1.065-2.165,.729-3.443-.181-.688-.575-1.32-1.11-1.79-2.005-1.758-4.933-1.05-6.007,1.162-.171-.353-.396-.677-.666-.962-1.451-1.528-3.867-1.591-5.395-.139-1.528,1.451-1.59,3.867-.139,5.395l5.48,5.694c.09,.094,.196,.16,.308,.211"
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

export default heart2User;

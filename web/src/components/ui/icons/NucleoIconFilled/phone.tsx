import React from 'react';

import type { iconProps } from './iconProps';

function phone(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px phone';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.555,11.745c-.045,0-.09-.001-.136-.005-2.357-.19-4.579-1.219-6.256-2.897C1.485,7.166.456,4.943.266,2.586c-.064-.786.43-1.511,1.202-1.764l1.552-.51c.773-.2,1.515.158,1.817.841l.568,1.392c.271.61.091,1.352-.448,1.783l-2.044,1.762c.362.612.801,1.181,1.312,1.69.51.51,1.079.95,1.69,1.312l1.78-2.064c.414-.518,1.155-.7,1.787-.419l1.35.551c.704.312,1.063,1.057.875,1.781l-.524,1.599c-.238.726-.896,1.206-1.627,1.206Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default phone;

import React from 'react';

import type { iconProps } from './iconProps';

function caretExpandY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret expand y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.586,3.001l-2.348,3.468c-.225,.332,.013,.78,.414,.78h4.696c.401,0,.639-.448,.414-.78l-2.348-3.468c-.198-.293-.63-.293-.828,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.586,14.999l-2.348-3.468c-.225-.332,.013-.78,.414-.78h4.696c.401,0,.639,.448,.414,.78l-2.348,3.468c-.198,.293-.63,.293-.828,0Z"
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

export default caretExpandY;

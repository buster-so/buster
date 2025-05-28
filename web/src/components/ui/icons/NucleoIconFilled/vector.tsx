import React from 'react';

import type { iconProps } from './iconProps';

function vector(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vector';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.75,5.25c0-.414-.336-.75-.75-.75H2.792c-.26-.447-.738-.75-1.292-.75-.828,0-1.5,.672-1.5,1.5s.672,1.5,1.5,1.5c.554,0,1.032-.303,1.292-.75h1.802c-1.297,1.209-2.094,2.914-2.094,4.75,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.081,1.311-3.966,3.261-4.689,.317-.118,.496-.427,.477-.747,.002-.022,.013-.041,.013-.063Z"
          fill="currentColor"
        />
        <path
          d="M16.5,3.75c-.554,0-1.032,.303-1.292,.75h-4.208c-.414,0-.75,.336-.75,.75,0,.022,.011,.041,.013,.063-.019,.321,.159,.63,.477,.747,1.95,.724,3.261,2.608,3.261,4.689,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-1.836-.797-3.541-2.094-4.75h1.802c.26,.447,.738,.75,1.292,.75,.828,0,1.5-.672,1.5-1.5s-.672-1.5-1.5-1.5Z"
          fill="currentColor"
        />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="6.75" y="3" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1" y="10.5" />
        <rect
          height="4.5"
          width="4.5"
          fill="currentColor"
          rx="1.432"
          ry="1.432"
          x="12.5"
          y="10.5"
        />
      </g>
    </svg>
  );
}

export default vector;

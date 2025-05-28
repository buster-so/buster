import React from 'react';

import type { iconProps } from './iconProps';

function feather2Plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px feather 2 plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.5,2.5h-1.5V1c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5H1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.846,2.904c-1.697-1.697-4.459-1.697-6.156,0L4.806,7.788c-.52,.52-.806,1.21-.806,1.945v3.957l-2.03,2.03c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l5.094-5.093c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-2.002,2.002h1.835c.734,0,1.425-.286,1.944-.806l4.884-4.883c.822-.823,1.275-1.916,1.275-3.079s-.453-2.256-1.275-3.079Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default feather2Plus;

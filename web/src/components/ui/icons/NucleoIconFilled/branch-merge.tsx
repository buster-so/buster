import React from 'react';

import type { iconProps } from './iconProps';

function branchMerge(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px branch merge';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,5.5h2.421c.334,0,.648,.13,.884,.366l2.414,2.414c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-2.414-2.414c-.52-.52-1.21-.806-1.945-.806H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.78,9.72l-2.75-2.75c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H14.439l-1.47,1.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default branchMerge;

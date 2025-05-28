import React from 'react';

import type { iconProps } from './iconProps';

function armchair(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px armchair';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.25,4.5c2.067,0,3.75,1.682,3.75,3.75v1.75h4v-1.75c0-2.068,1.683-3.75,3.75-3.75,.086,0,.166,.02,.25,.025v-.775c0-1.517-1.233-2.75-2.75-2.75H5.75c-1.517,0-2.75,1.233-2.75,2.75v.775c.084-.006,.164-.025,.25-.025Z"
          fill="currentColor"
        />
        <path
          d="M14.75,6c-1.24,0-2.25,1.009-2.25,2.25v3.25H5.5v-3.25c0-1.241-1.01-2.25-2.25-2.25s-2.25,1.009-2.25,2.25c0,.778,.398,1.465,1,1.869v2.131c0,1.431,1.102,2.596,2.5,2.725v1.275c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.25h6v1.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.275c1.398-.128,2.5-1.294,2.5-2.725v-2.131c.602-.404,1-1.091,1-1.869,0-1.241-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default armchair;

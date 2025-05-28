import React from 'react';

import type { iconProps } from './iconProps';

function envelopeClip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope clip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,18c-1.792,0-3.25-1.458-3.25-3.25v-2.5c0-1.103,.897-2,2-2s2,.897,2,2v2c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2c0-.276-.224-.5-.5-.5s-.5,.224-.5,.5v2.5c0,.965,.785,1.75,1.75,1.75s1.75-.785,1.75-1.75v-2c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2c0,1.792-1.458,3.25-3.25,3.25Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2.5H3.75c-1.517,0-2.75,1.233-2.75,2.75v7.5c0,1.517,1.233,2.75,2.75,2.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25V7.021l5.654,3.119c.265,.146,.555,.22,.846,.22s.581-.073,.845-.219l5.655-3.12v2.693c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V5.25c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default envelopeClip;

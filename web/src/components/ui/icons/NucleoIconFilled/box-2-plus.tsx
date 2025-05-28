import React from 'react';

import type { iconProps } from './iconProps';

function box2Plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box 2 plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4.932 3.833H12.318999999999999V5.333H4.932z"
          fill="currentColor"
          transform="rotate(-23.962 8.625 4.583)"
        />
        <path
          d="M17.25,12.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.055,4.064L9.712,1.247c-.451-.202-.969-.202-1.422,0L1.945,4.064c-.271,.121-.445,.389-.445,.686v7.85c0,.69,.408,1.318,1.039,1.599l5.751,2.557c.226,.1,.468,.15,.71,.15s.485-.05,.71-.151l1.551-.69c.378-.168,.549-.611,.38-.99s-.61-.551-.99-.38l-.903,.401v-6.86l5.25-2.333v2.557c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.711c0-.296-.175-.565-.445-.686Zm-7.155-1.448c.063-.028,.137-.029,.202,0l4.802,2.133-4.802,2.134c-.063,.028-.137,.029-.202,0l-4.802-2.134,4.802-2.134Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default box2Plus;

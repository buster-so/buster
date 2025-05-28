import React from 'react';

import type { iconProps } from './iconProps';

function box2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.055,4.064L9.711,1.245c-.453-.202-.972-.2-1.422,0L1.945,4.064c-.271,.121-.445,.389-.445,.686v7.85c0,.69,.408,1.318,1.039,1.6l5.75,2.555c.226,.101,.469,.151,.711,.151s.485-.05,.711-.15l5.75-2.556c.631-.281,1.039-.909,1.039-1.599V4.75c0-.296-.174-.565-.445-.686Zm-7.156-1.449c.064-.028,.138-.028,.202,0t0,0l1.051,.467-4.903,2.179-1.153-.512,4.802-2.134Zm.202,4.269c-.064,.028-.138,.029-.203,0l-1.801-.8,4.903-2.179,1.903,.846-4.802,2.134Zm5.899,5.716c0,.099-.059,.188-.148,.229l-5.102,2.267v-6.858l5.25-2.333v6.696Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default box2;

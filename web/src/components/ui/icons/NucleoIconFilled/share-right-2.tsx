import React from 'react';

import type { iconProps } from './iconProps';

function shareRight2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share right 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.265,1.205c-.218-.205-.536-.262-.812-.144-.275,.119-.453,.39-.453,.689V3.783c-4.723,.422-6,4.832-6,7.217,0,.329,.215,.619,.529,.716,.073,.022,.147,.034,.221,.034,.243,0,.477-.119,.62-.327,.02-.029,1.868-2.685,4.63-3.114v1.942c0,.299,.178,.57,.453,.689,.276,.119,.594,.062,.812-.144l4.5-4.25c.15-.142,.235-.339,.235-.545s-.085-.404-.235-.545L12.265,1.205Z"
          fill="currentColor"
        />
        <path
          d="M15.25,10c-.414,0-.75,.336-.75,.75v2.5c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75v-2.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareRight2;

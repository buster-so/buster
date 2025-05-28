import React from 'react';

import type { iconProps } from './iconProps';

function arrowBoldRightToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow bold right to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.539,7.988L7.983,3.967c-.381-.276-.881-.315-1.302-.101-.42,.214-.682,.641-.682,1.113v1.521H2.75c-.965,0-1.75,.785-1.75,1.75v1.5c0,.965,.785,1.75,1.75,1.75h3.25v1.521c0,.472,.261,.898,.681,1.113,.181,.092,.375,.137,.569,.137,.258,0,.514-.08,.732-.238l5.556-4.021c.324-.234,.517-.613,.517-1.013,0-.4-.194-.778-.517-1.012Z"
          fill="currentColor"
        />
        <path
          d="M16.25,3c-.414,0-.75,.336-.75,.75V14.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowBoldRightToLine;

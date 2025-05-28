import React from 'react';

import type { iconProps } from './iconProps';

function arrowSymbolLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow symbol left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,9.75H3c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M7,14c-.305,0-.592-.188-.703-.49-1.131-3.061-3.629-3.756-3.735-3.784-.33-.088-.562-.388-.56-.729,.002-.342,.232-.64,.563-.724,.103-.027,2.601-.722,3.731-3.783,.143-.388,.573-.587,.963-.444,.389,.144,.587,.575,.443,.963-.782,2.12-2.12,3.328-3.181,3.99,1.061,.662,2.398,1.87,3.181,3.99,.144,.389-.055,.82-.443,.963-.086,.032-.174,.046-.26,.046Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowSymbolLeft;

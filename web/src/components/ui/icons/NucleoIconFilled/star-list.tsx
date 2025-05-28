import React from 'react';

import type { iconProps } from './iconProps';

function starList(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px star list';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16,14h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9.603,13c-.516-.413-.853-1.04-.853-1.75,0-1.241,1.009-2.25,2.25-2.25h4.29l1.483-1.445c.205-.199,.278-.498,.19-.769-.088-.271-.323-.469-.605-.51l-4.62-.671L9.672,1.418c-.252-.512-1.093-.512-1.345,0l-2.066,4.186-4.62,.671c-.282,.041-.517,.239-.605,.51-.088,.271-.015,.57,.19,.769l3.343,3.258-.79,4.601c-.048,.282,.067,.566,.298,.734,.232,.167,.538,.189,.79,.057l3.986-2.096c.133-.443,.396-.826,.749-1.108Z"
          fill="currentColor"
        />
        <path
          d="M11,12h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default starList;

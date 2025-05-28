import React from 'react';

import type { iconProps } from './iconProps';

function editPolygon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px edit polygon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.751,13c-.038,0-.076-.003-.115-.009-.409-.063-.69-.446-.627-.855l1-6.5c.062-.409,.444-.688,.855-.627,.409,.063,.69,.446,.627,.855l-1,6.5c-.057,.371-.376,.636-.74,.636Z"
          fill="currentColor"
        />
        <path
          d="M12.25,15H5.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h6.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.249,13c-.364,0-.684-.265-.74-.636l-1-6.5c-.063-.41,.218-.792,.627-.855,.417-.061,.793,.218,.855,.627l1,6.5c.063,.41-.218,.792-.627,.855-.039,.006-.077,.009-.115,.009Z"
          fill="currentColor"
        />
        <path
          d="M10.75,4.5h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="1.5" y="12" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="3" y="1.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="10.5" y="1.5" />
        <rect height="4.5" width="4.5" fill="currentColor" rx="1.432" ry="1.432" x="12" y="12" />
      </g>
    </svg>
  );
}

export default editPolygon;

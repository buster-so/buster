import React from 'react';

import type { iconProps } from './iconProps';

function penWriting8(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen writing 8';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.398,13.37c.125,.086,.273,.13,.422,.13,.063,0,.126-.008,.188-.024,.113-.029,2.789-.74,4.028-2.559l4.037-5.921c.369-.541,.505-1.193,.383-1.836-.122-.643-.487-1.201-1.028-1.569-.541-.369-1.195-.503-1.836-.383-.644,.122-1.201,.487-1.57,1.028l-4.037,5.921c-1.24,1.818-.924,4.567-.91,4.684,.026,.215,.144,.408,.322,.53Z"
          fill="currentColor"
        />
        <path
          d="M2.25,13.5h2.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.75,15.5H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default penWriting8;

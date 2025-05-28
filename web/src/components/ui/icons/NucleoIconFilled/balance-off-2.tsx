import React from 'react';

import type { iconProps } from './iconProps';

function balanceOff2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px balance off 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.267,8.317L2.003,5.708c-.406-.073-.798,.196-.873,.603s.195,.798,.603,.873l14.264,2.609c.045,.008,.091,.012,.136,.012,.355,0,.67-.253,.737-.615,.075-.407-.195-.798-.603-.873Z"
          fill="currentColor"
        />
        <path
          d="M10.135,10.155c-.474-.82-1.797-.82-2.271,0l-2.816,4.878c-.237,.411-.237,.9,0,1.311,.237,.41,.662,.655,1.135,.655h5.633c.474,0,.898-.245,1.135-.655,.237-.411,.237-.9,0-1.311l-2.816-4.878Z"
          fill="currentColor"
        />
        <circle cx="14" cy="4" fill="currentColor" r="3" />
        <circle cx="3.25" cy="2.75" fill="currentColor" r="2.25" />
      </g>
    </svg>
  );
}

export default balanceOff2;

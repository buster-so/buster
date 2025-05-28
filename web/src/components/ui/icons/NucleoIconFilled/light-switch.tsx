import React from 'react';

import type { iconProps } from './iconProps';

function lightSwitch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px light switch';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.886,17H6.114c-.801,0-1.499-.542-1.696-1.318l-.289-1.137c-.102-.401,.141-.81,.542-.912,.402-.102,.81,.142,.912,.542l.289,1.136c.028,.11,.128,.188,.242,.188h5.772c.114,0,.214-.078,.243-.188l.288-1.136c.102-.401,.51-.644,.912-.542,.401,.102,.645,.51,.542,.912l-.289,1.136c-.198,.777-.896,1.319-1.696,1.319Z"
          fill="currentColor"
        />
        <path
          d="M13.889,14.045l-.889-5.357V2.25c0-.689-.561-1.25-1.25-1.25H6.25c-.689,0-1.25,.561-1.25,1.25v6.438l-.889,5.356c-.061,.363,.041,.732,.279,1.014,.238,.281,.585,.442,.954,.442h7.312c.368,0,.716-.161,.954-.442,.238-.281,.34-.65,.279-1.013Zm-8.25-.045l.83-5h5.063l.83,5H5.639Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default lightSwitch;

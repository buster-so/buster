import React from 'react';

import type { iconProps } from './iconProps';

function invoice(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px invoice';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.75,1H5.25c-1.517,0-2.75,1.233-2.75,2.75v12.5c0,.265,.14,.51,.367,.645,.226,.134,.508,.14,.742,.013l2.406-1.312,2.649,1.325c.211,.105,.46,.105,.671,0l2.649-1.325,2.406,1.312c.112,.062,.236,.092,.359,.092,.132,0,.265-.035,.383-.105,.228-.135,.367-.38,.367-.645V3.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.5,11h-3.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Zm-.25-3.5c-1.105,0-2-.896-2-2s.895-2,2-2,2,.896,2,2-.895,2-2,2Zm3.25,3.5h-.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default invoice;

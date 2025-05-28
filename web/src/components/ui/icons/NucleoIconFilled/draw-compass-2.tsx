import React from 'react';

import type { iconProps } from './iconProps';

function drawCompass2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px draw compass 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.909,15.892L10.795,6.483c.434-.45,.705-1.059,.705-1.733,0-1.115-.739-2.052-1.75-2.372v-.878c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.878c-1.011,.321-1.75,1.257-1.75,2.372,0,.673,.27,1.283,.705,1.733L2.091,15.892c-.198,.364-.063,.819,.301,1.017,.114,.062,.236,.091,.357,.091,.266,0,.523-.142,.66-.392L8.521,7.202c.155,.03,.315,.048,.479,.048s.323-.018,.479-.048l5.112,9.406c.136,.25,.394,.392,.66,.392,.121,0,.244-.029,.357-.091,.364-.198,.499-.653,.301-1.017Z"
          fill="currentColor"
        />
        <path
          d="M14.25,10.5h-4.5v-.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v.5H3.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.5v.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-.5h4.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default drawCompass2;

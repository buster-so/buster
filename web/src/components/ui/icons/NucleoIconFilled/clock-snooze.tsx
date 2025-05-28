import React from 'react';

import type { iconProps } from './iconProps';

function clockSnooze(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clock snooze';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.75,7c-.881,0-1.686-.518-2.049-1.32-.364-.803-.224-1.75,.357-2.412l.522-.597c-.45-.275-.785-.71-.954-1.219-.824-.288-1.705-.452-2.625-.452C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8c0-.692-.097-1.359-.263-2h-2.987Zm-.883,4.677c-.146,.21-.379,.323-.617,.323-.147,0-.296-.043-.426-.133l-3.25-2.25c-.203-.14-.323-.371-.323-.617V4.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v3.857l2.927,2.026c.341,.236,.426,.703,.19,1.043Z"
          fill="currentColor"
        />
        <path
          d="M17.25,5.5h-3.5c-.294,0-.562-.172-.683-.44s-.075-.583,.119-.804l2.412-2.756h-1.847c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.5c.294,0,.562,.172,.683,.44s.075,.583-.119,.804l-2.412,2.756h1.847c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clockSnooze;

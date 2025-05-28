import React from 'react';

import type { iconProps } from './iconProps';

function doNotWash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px do not wash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.383,14.617L11.964,6.036c-.159,.036-.308,.106-.415,.233-.125,.15-.264,.288-.412,.412-.681,.571-1.547,.844-2.429,.765-.885-.078-1.687-.496-2.258-1.178-.143-.17-.353-.268-.575-.268h-.001c-.222,0-.433,.099-.575,.27-.59,.708-1.441,1.118-2.354,1.168l-.45-3.777c-.049-.411-.422-.71-.833-.656-.411,.049-.705,.422-.656,.833l1.04,8.736c.104,.88,.619,1.619,1.338,2.042Z"
          fill="currentColor"
        />
        <path
          d="M16.131,4.748c-.406-.054-.785,.245-.833,.656l-.242,2.036c-.372-.02-.727-.114-1.064-.249l-7.81,7.81h7.042c1.393,0,2.566-1.042,2.73-2.425l.833-6.994c.049-.412-.245-.785-.656-.833Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default doNotWash;

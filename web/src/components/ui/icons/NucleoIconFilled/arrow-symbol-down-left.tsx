import React from 'react';

import type { iconProps } from './iconProps';

function arrowSymbolDownLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow symbol down left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M4,14.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L13.72,3.22c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L4.53,14.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M9.761,15c-.105,0-.212-.022-.313-.069-2.966-1.368-5.223-.091-5.317-.035-.293,.17-.67,.123-.911-.12-.24-.243-.288-.617-.113-.91,.053-.091,1.329-2.35-.036-5.312-.174-.376-.01-.822,.367-.995,.374-.173,.821-.009,.994,.367,.946,2.052,.854,3.853,.573,5.071,1.218-.283,3.018-.374,5.07,.572,.377,.173,.541,.619,.368,.995-.127,.274-.398,.436-.682,.436Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowSymbolDownLeft;

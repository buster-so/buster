import React from 'react';

import type { iconProps } from './iconProps';

function magicWand(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magic wand';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,16c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l7.999-7.999c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L3.28,15.78c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M16.57,6.859l-1.552-1.829,.627-2.315c.074-.275-.014-.569-.228-.758-.215-.189-.518-.239-.781-.131l-2.219,.911-2.008-1.312c-.239-.156-.544-.163-.792-.018-.246,.145-.388,.417-.366,.702l.181,2.392-1.868,1.505c-.222,.179-.324,.469-.261,.748,.062,.279,.277,.498,.555,.565l2.33,.567,.854,2.241c.102,.267,.346,.453,.63,.479,.024,.002,.047,.003,.071,.003,.258,0,.501-.133,.638-.356l1.26-2.041,2.396-.12c.285-.014,.537-.189,.651-.451,.113-.262,.068-.565-.117-.783Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default magicWand;

import React from 'react';

import type { iconProps } from './iconProps';

function searchChart(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px search chart';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,16c-.192,0-.384-.073-.53-.22l-3.965-3.965c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.965,3.965c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M9.961,9.473c-.206,.206-.48,.32-.773,.321h0c-.292,0-.567-.114-.774-.321l-2.1-2.1-1.398,1.396c-.293,.292-.768,.292-1.061,0-.292-.293-.292-.768,0-1.061l1.685-1.682c.205-.206,.48-.32,.772-.32h0c.292,0,.567,.114,.774,.321l2.1,2.099,3.428-3.427c-1.019-1.618-2.816-2.699-4.865-2.699-3.17,0-5.75,2.58-5.75,5.75s2.58,5.75,5.75,5.75,5.75-2.58,5.75-5.75c0-.551-.083-1.083-.228-1.588l-3.311,3.311Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default searchChart;

import React from 'react';

import type { iconProps } from './iconProps';

function diagramVenn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px diagram venn';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M5.947 6.5H12.051V8H5.947z" fill="currentColor" />
        <path d="M6.107 10H11.892V11.5H6.107z" fill="currentColor" />
        <path
          d="M11.5,2.25c-.886,0-1.73,.179-2.5,.501-.77-.322-1.614-.501-2.5-.501C2.916,2.25,0,5.166,0,8.75s2.916,6.5,6.5,6.5c.886,0,1.73-.179,2.5-.501,.77,.322,1.614,.501,2.5,.501,3.584,0,6.5-2.916,6.5-6.5s-2.916-6.5-6.5-6.5ZM6.5,13.75c-2.757,0-5-2.243-5-5S3.743,3.75,6.5,3.75c.263,0,.515,.038,.767,.078-1.385,1.193-2.267,2.955-2.267,4.922s.882,3.729,2.267,4.922c-.252,.039-.505,.078-.767,.078Zm5-5c0,1.842-1.013,3.437-2.5,4.304-1.487-.867-2.5-2.462-2.5-4.304s1.013-3.437,2.5-4.304c1.487,.867,2.5,2.462,2.5,4.304Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default diagramVenn;

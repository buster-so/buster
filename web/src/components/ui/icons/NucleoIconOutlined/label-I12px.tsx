import type { iconProps } from './iconProps';

function label(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px label';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.088,3.868l3.25-2.868c.378-.334.945-.334,1.323,0l3.25,2.868c.215.19.338.463.338.75v4.133c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2v-4.133c0-.287.123-.56.338-.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="5" fill="currentColor" r="1" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default label;

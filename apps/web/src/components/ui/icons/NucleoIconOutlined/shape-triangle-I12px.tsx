import type { iconProps } from './iconProps';

function shapeTriangle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px shape triangle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m9.789,10.747c1.123,0,1.826-1.216,1.265-2.189L7.265,1.981c-.562-.975-1.969-.975-2.53,0L.946,8.558c-.561.973.142,2.189,1.265,2.189h7.579Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default shapeTriangle;

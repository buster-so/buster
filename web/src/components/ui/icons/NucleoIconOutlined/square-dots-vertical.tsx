import type { iconProps } from './iconProps';

function squareDotsVertical(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square dots vertical';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9)"
          x="2.75"
          y="2.75"
        />
        <path d="M10,9c0,.551-.449,1-1,1s-1-.449-1-1,.449-1,1-1,1,.449,1,1Z" fill="currentColor" />
        <path
          d="M10,12.5c0,.551-.449,1-1,1s-1-.449-1-1,.449-1,1-1,1,.449,1,1Z"
          fill="currentColor"
        />
        <path
          d="M10,5.5c0,.551-.449,1-1,1s-1-.449-1-1,.449-1,1-1,1,.449,1,1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareDotsVertical;

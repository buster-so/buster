import type { iconProps } from './iconProps';

function moveObjRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px move obj right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25 6L11 6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 8.5L11.25 6 8.75 3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="3"
          width="10.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 2.25 6)"
          x="-3"
          y="4.5"
        />
      </g>
    </svg>
  );
}

export default moveObjRight;
